package org.example.salamainsurance.Service.Chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.DTO.ChatRequest;
import org.example.salamainsurance.DTO.ChatResponse;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HuggingFaceChatService {

  @Value("${huggingface.api.key}")
  private String apiKey;

  private final ClaimRepository claimRepository;
  private final ExpertHassenRepository expertRepository;
  private final RestTemplate restTemplate = new RestTemplate();
  private final ObjectMapper objectMapper = new ObjectMapper();

  private static final String HF_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

  public ChatResponse processMessage(ChatRequest request, User currentUser) {
    try {
      log.info("Message: {} - User: {}", request.getMessage(), currentUser.getEmail());

      // Récupérer les sinistres accessibles
      List<Claim> accessibleClaims = getAccessibleClaims(currentUser);

      // 1. D'abord, chercher un sinistre spécifique dans le message
      Claim foundClaim = findClaimInMessage(request.getMessage(), accessibleClaims);
      if (foundClaim != null) {
        return getClaimInfoResponse(foundClaim, currentUser);
      }

      // 2. Questions sur "mes sinistres" ou "statistiques"
      if (request.getMessage().toLowerCase().contains("mes sinistres")) {
        return getMyClaimsResponse(currentUser, accessibleClaims);
      }

      if (request.getMessage().toLowerCase().contains("statistiques")) {
        return getStatisticsResponse(currentUser, accessibleClaims);
      }

      // 3. Questions de base PRÉDÉFINIES (juste quelques-unes)
      String lowerMsg = request.getMessage().toLowerCase();

      if (lowerMsg.contains("comment déclarer") || lowerMsg.contains("comment declarer")) {
        return simpleResponse("📝 **Comment déclarer un sinistre ?**\n\n1. Connectez-vous à votre espace client\n2. Cliquez sur 'Nouvelle déclaration'\n3. Remplissez le formulaire\n4. Joignez les photos et le constat\n5. Validez\n\nUn expert vous contactera sous 24h.");
      }

      if (lowerMsg.contains("documents") || lowerMsg.contains("fournir")) {
        return simpleResponse("📄 **Documents nécessaires :**\n\n• Constat amiable\n• Photos des dégâts\n• Carte grise\n• Permis de conduire\n• Relevé d'information");
      }

      if (lowerMsg.contains("délai") || lowerMsg.contains("delai")) {
        return simpleResponse("⏱️ **Délais :**\n\n• Assignation expert : 24h\n• Expertise : 5-7 jours\n• Indemnisation : 3-5 jours après expertise\n\nTotal estimé : 15-20 jours.");
      }

      if (lowerMsg.contains("indemnisation") || lowerMsg.contains("calcul")) {
        return simpleResponse("💰 **Indemnisation =** Estimation - Franchise - Vétusté\n\nExemple : 5000 DT - 300 DT - 450 DT = 4250 DT");
      }

      if ((lowerMsg.contains("expert") && lowerMsg.contains("contacter")) || lowerMsg.contains("joindre expert")) {
        // Chercher un sinistre actif avec expert
        Optional<Claim> activeClaim = accessibleClaims.stream()
          .filter(c -> c.getExpert() != null && c.getStatus() != ClaimStatus.CLOSED)
          .findFirst();

        if (activeClaim.isPresent() && activeClaim.get().getExpert() != null) {
          ExpertHassen e = activeClaim.get().getExpert();
          return simpleResponse(String.format("👨‍🔧 **Votre expert :** %s %s\n📞 %s\n\nPour le sinistre : %s",
            e.getFirstName(), e.getLastName(), e.getPhone(), activeClaim.get().getReference()));
        }
        return simpleResponse("👨‍🔧 Pour contacter votre expert, connectez-vous à votre espace client ou appelez le 71 123 456.");
      }

      // 4. Tout le reste → IA (HuggingFace)
      String prompt = "Tu es un assistant assurance. Réponds de façon naturelle et utile.\n\nQuestion: " + request.getMessage();
      String aiResponse = callHuggingFaceAPI(prompt);

      return ChatResponse.builder()
        .message(aiResponse)
        .sender("bot")
        .timestamp(LocalDateTime.now())
        .build();

    } catch (Exception e) {
      log.error("Erreur: {}", e.getMessage());
      return simpleResponse("❌ Désolé, une erreur est survenue. Veuillez réessayer.");
    }
  }

  // ==================== RÉPONSE SIMPLE ====================
  private ChatResponse simpleResponse(String message) {
    return ChatResponse.builder()
      .message(message)
      .sender("bot")
      .timestamp(LocalDateTime.now())
      .build();
  }

  // ==================== RÉCUPÉRER LES SINISTRES ====================
  private List<Claim> getAccessibleClaims(User user) {
    if (user.getRole() == RoleName.EXPERT) {
      Optional<ExpertHassen> expert = expertRepository.findByEmail(user.getEmail());
      if (expert.isPresent()) {
        return claimRepository.findByExpertId(expert.get().getIdExpert());
      }
      return Collections.emptyList();
    }
    return claimRepository.findAll();
  }

  // ==================== CHERCHER UN SINISTRE ====================
  private Claim findClaimInMessage(String message, List<Claim> claims) {
    Pattern refPattern = Pattern.compile("(CLM-\\d{8}-\\d{4})");
    Matcher refMatcher = refPattern.matcher(message);
    if (refMatcher.find()) {
      String ref = refMatcher.group(1);
      return claims.stream().filter(c -> c.getReference().equals(ref)).findFirst().orElse(null);
    }
    return null;
  }

  // ==================== INFOS D'UN SINISTRE ====================
  private ChatResponse getClaimInfoResponse(Claim claim, User user) {
    ExpertHassen expert = claim.getExpert();
    long daysOpen = claim.getOpeningDate() != null ?
      java.time.Duration.between(claim.getOpeningDate(), LocalDateTime.now()).toDays() : 0;

    String response = String.format("""
        📋 **Sinistre %s**

        ▸ **Statut :** %s
        ▸ **Gravité :** %s
        ▸ **Ouvert depuis :** %d jours
        ▸ **Expert :** %s
        ▸ **Tél expert :** %s

        %s
        """,
      claim.getReference(),
      claim.getStatus(),
      claim.getSeverityLevel() != null ? claim.getSeverityLevel() : "Non définie",
      daysOpen,
      expert != null ? expert.getFirstName() + " " + expert.getLastName() : "Non assigné",
      expert != null ? (expert.getPhone() != null ? expert.getPhone() : "Non disponible") : "-",
      getStatusHelp(claim.getStatus())
    );

    return simpleResponse(response);
  }

  // ==================== LISTE DES SINISTRES ====================
  private ChatResponse getMyClaimsResponse(User user, List<Claim> claims) {
    if (claims.isEmpty()) {
      return simpleResponse("📋 Vous n'avez aucun sinistre enregistré.");
    }

    StringBuilder sb = new StringBuilder("📋 **VOS SINISTRES**\n\n");
    for (Claim c : claims.stream().limit(10).toList()) {
      sb.append("• **").append(c.getReference()).append("** - ").append(c.getStatus()).append("\n");
      sb.append("  Ouvert le : ").append(formatDate(c.getOpeningDate())).append("\n");
      if (c.getExpert() != null) {
        sb.append("  Expert : ").append(c.getExpert().getFirstName()).append(" ").append(c.getExpert().getLastName()).append("\n");
      }
      sb.append("\n");
    }
    if (claims.size() > 10) {
      sb.append("_Et ").append(claims.size() - 10).append(" autre(s)..._");
    }
    return simpleResponse(sb.toString());
  }

  // ==================== STATISTIQUES ====================
  private ChatResponse getStatisticsResponse(User user, List<Claim> claims) {
    long total = claims.size();
    Map<ClaimStatus, Long> byStatus = claims.stream()
      .collect(Collectors.groupingBy(Claim::getStatus, Collectors.counting()));

    StringBuilder sb = new StringBuilder("📊 **STATISTIQUES**\n\n");
    sb.append("Total : **").append(total).append("** sinistre(s)\n\n");
    sb.append("**Par statut :**\n");
    byStatus.forEach((status, count) -> sb.append("• ").append(status).append(" : ").append(count).append("\n"));

    return simpleResponse(sb.toString());
  }

  // ==================== AIDE SUR LE STATUT ====================
  private String getStatusHelp(ClaimStatus status) {
    if (status == null) return "";
    return switch (status) {
      case OPENED -> "\n📌 Un expert sera assigné sous 24h.";
      case ASSIGNED_TO_EXPERT -> "\n📌 L'expert va vous contacter prochainement.";
      case IN_PROGRESS -> "\n📌 Expertise en cours.";
      case CLOSED -> "\n📌 Sinistre clôturé.";
      default -> "";
    };
  }

  // ==================== UTILITAIRES ====================
  private String formatDate(LocalDateTime date) {
    if (date == null) return "Non spécifiée";
    return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
  }

  private String callHuggingFaceAPI(String prompt) {
    try {
      Map<String, Object> requestBody = new HashMap<>();
      requestBody.put("inputs", prompt);
      requestBody.put("parameters", Map.of("max_new_tokens", 200, "temperature", 0.7));

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);
      headers.set("Authorization", "Bearer " + apiKey);

      HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

      ResponseEntity<String> response = restTemplate.exchange(
        HF_URL,
        HttpMethod.POST,
        entity,
        String.class
      );

      if (response.getStatusCode() == HttpStatus.OK) {
        JsonNode root = objectMapper.readTree(response.getBody());
        if (root.isArray() && root.size() > 0 && root.get(0).has("generated_text")) {
          return root.get(0).get("generated_text").asText().trim();
        }
      }
    } catch (Exception e) {
      log.error("Erreur API HuggingFace: {}", e.getMessage());
    }

    // Fallback si l'API échoue
    return "🤖 Je suis désolé, je n'ai pas encore appris à répondre à cette question.\n\n" +
      "Voici ce que je peux faire pour vous aider :\n" +
      "• Consulter vos sinistres\n" +
      "• Donner le statut d'un sinistre spécifique\n" +
      "• Vous expliquer comment déclarer un sinistre\n" +
      "• Vous donner les documents nécessaires\n\n" +
      "Pour toute autre question, notre service client est disponible au 71 123 456.";
  }
}
