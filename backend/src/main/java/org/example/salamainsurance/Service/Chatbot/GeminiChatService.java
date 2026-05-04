package org.example.salamainsurance.Service.Chatbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.DTO.ChatRequest;
import org.example.salamainsurance.DTO.ChatResponse;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiChatService {

  @Value("${gemini.api.key}")
  private String apiKey;

  private final ClaimRepository claimRepository;
  private final RestTemplate restTemplate = new RestTemplate();
  private final ObjectMapper objectMapper = new ObjectMapper();

  // UTILISER LE BON MODÈLE - Essayez ces URLs une par une
  private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  // private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  // private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

  public ChatResponse processMessage(ChatRequest request) {
    try {
      log.info("=== DÉBUT TRAITEMENT CHATBOT ===");
      log.info("Message reçu: {}", request.getMessage());
      log.info("Clé API: {}", apiKey != null ? "Présente" : "ABSENTE");

      // Récupérer le contexte du sinistre si disponible
      String context = buildContext(request);

      // Construire le prompt intelligent
      String prompt = buildIntelligentPrompt(request.getMessage(), context, request.getUserType());
      log.info("Prompt construit (longueur: {} caractères)", prompt.length());

      // Appeler Gemini API
      String aiResponse = callGeminiAPI(prompt);
      log.info("Réponse IA reçue: {}", aiResponse);

      // Analyser l'intention
      String intent = detectIntent(aiResponse);

      return ChatResponse.builder()
        .message(aiResponse)
        .sender("bot")
        .timestamp(LocalDateTime.now())
        .intent(intent)
        .build();

    } catch (Exception e) {
      log.error("Erreur Gemini: {}", e.getMessage(), e);

      // Retourner une réponse personnalisée basée sur la question
      return getPersonalizedFallback(request.getMessage());
    }
  }

  private String buildContext(ChatRequest request) {
    StringBuilder context = new StringBuilder();

    if (request.getClaimId() != null) {
      Optional<Claim> claimOpt = claimRepository.findById(request.getClaimId());
      if (claimOpt.isPresent()) {
        Claim claim = claimOpt.get();
        context.append("=== INFORMATIONS DU SINISTRE ===\n");
        context.append("Référence: ").append(claim.getReference()).append("\n");
        context.append("Statut: ").append(claim.getStatus()).append("\n");
        context.append("Date d'ouverture: ").append(claim.getOpeningDate()).append("\n");
        context.append("Gravité: ").append(claim.getSeverityLevel()).append("\n");

        long daysOpen = ChronoUnit.DAYS.between(claim.getOpeningDate(), LocalDateTime.now());
        context.append("Jours depuis ouverture: ").append(daysOpen).append("\n");

        if (claim.getExpert() != null) {
          context.append("Expert assigné: ").append(claim.getExpert().getFirstName())
            .append(" ").append(claim.getExpert().getLastName()).append("\n");
          context.append("Contact expert: ").append(claim.getExpert().getPhone()).append("\n");
        }
        context.append("\n");
      }
    }

    return context.toString();
  }

  private String buildIntelligentPrompt(String userMessage, String context, String userType) {
    return String.format("""
            Tu es un assistant expert en assurance sinistres pour Salama Insurance.

            Type d'utilisateur: %s

            %s

            Voici la question de l'utilisateur: "%s"

            Réponds de manière naturelle, empathique et utile. Utilise les informations du contexte si disponibles.
            """,
      userType,
      context.isEmpty() ? "Aucun sinistre spécifique sélectionné." : context,
      userMessage);
  }

  private String callGeminiAPI(String prompt) throws Exception {
    String url = GEMINI_URL + "?key=" + apiKey;
    log.info("Appel API: {}", url);

    Map<String, Object> requestBody = new HashMap<>();
    List<Map<String, Object>> contents = new ArrayList<>();
    Map<String, Object> content = new HashMap<>();
    List<Map<String, String>> parts = new ArrayList<>();
    Map<String, String> part = new HashMap<>();
    part.put("text", prompt);
    parts.add(part);
    content.put("parts", parts);
    contents.add(content);
    requestBody.put("contents", contents);

    Map<String, Object> generationConfig = new HashMap<>();
    generationConfig.put("temperature", 0.7);
    generationConfig.put("maxOutputTokens", 500);
    generationConfig.put("topP", 0.9);
    requestBody.put("generationConfig", generationConfig);

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

    ResponseEntity<String> response = restTemplate.exchange(
      url,
      HttpMethod.POST,
      entity,
      String.class
    );

    log.info("Statut réponse: {}", response.getStatusCode());
    log.info("Body réponse: {}", response.getBody());

    if (response.getStatusCode() != HttpStatus.OK) {
      throw new Exception("Erreur API: " + response.getStatusCode() + " - " + response.getBody());
    }

    JsonNode root = objectMapper.readTree(response.getBody());

    if (root.has("candidates") && root.get("candidates").size() > 0) {
      JsonNode candidate = root.get("candidates").get(0);
      if (candidate.has("content") && candidate.get("content").has("parts")) {
        return candidate.get("content").get("parts").get(0).get("text").asText();
      }
    }

    throw new Exception("Format de réponse inattendu");
  }

  private String detectIntent(String response) {
    String lowerResponse = response.toLowerCase();
    if (lowerResponse.contains("statut")) return "status";
    if (lowerResponse.contains("délai")) return "timeline";
    if (lowerResponse.contains("indemnisation")) return "indemnity";
    if (lowerResponse.contains("document")) return "document";
    if (lowerResponse.contains("expert")) return "expert";
    return "general";
  }

  private ChatResponse getPersonalizedFallback(String message) {
    String lowerMessage = message.toLowerCase();
    String response;

    // Détection des intentions spécifiques
    if (lowerMessage.contains("statut") || lowerMessage.contains("avance")) {
      response = "🔍 Pour connaître le statut précis de votre sinistre, je vous invite à vous connecter à votre espace client. Vous y trouverez toutes les informations actualisées. Si vous avez besoin d'aide, notre service client est joignable au 71 123 456.";
    }
    else if (lowerMessage.contains("véhicule") && lowerMessage.contains("prêt")) {
      response = "🚗 Concernant le véhicule de prêt : cette option dépend de votre contrat d'assurance. Je vous invite à vérifier les conditions de votre garantie 'Véhicule de remplacement' dans votre contrat. Pour plus d'informations, contactez notre service client au 71 123 456.";
    }
    else if (lowerMessage.contains("désaccord") || lowerMessage.contains("réclamation")) {
      response = "📝 Je comprends votre insatisfaction. Pour contester le montant de l'indemnisation, vous pouvez :\n\n1️⃣ Contacter directement votre expert pour plus d'explications\n2️⃣ Envoyer une réclamation écrite à reclamations@salama.tn\n3️⃣ Appeler notre service réclamation au 71 123 456\n\nNous traitons toutes les réclamations dans un délai de 10 jours ouvrés.";
    }
    else if (lowerMessage.contains("documents") && lowerMessage.contains("envoyé")) {
      response = "📄 Merci d'avoir envoyé vos documents. Le délai de traitement après réception des documents est de 5 à 7 jours ouvrés. Si votre sinistre est toujours bloqué, je vous invite à contacter votre expert directement ou notre service client pour un suivi personnalisé.";
    }
    else if (lowerMessage.contains("garagiste") && lowerMessage.contains("expert")) {
      response = "🔧 Un délai de 2 semaines peut être normal selon la complexité de l'expertise. Je vous conseille de :\n\n1️⃣ Vérifier vos emails (peut-être un message de l'expert est passé dans vos spams)\n2️⃣ Contacter le service client au 71 123 456 avec votre numéro de sinistre\n3️⃣ Demander un suivi auprès de votre garagiste qui peut contacter directement l'expert";
    }
    else if (lowerMessage.contains("délai")) {
      response = "⏱️ Délais estimés pour votre sinistre :\n\n• Délai de traitement standard : 10-15 jours ouvrés\n• Expertise : généralement réalisée dans les 5 jours après validation\n• Indemnisation : sous 3-5 jours après validation du rapport d'expertise\n\nCes délais peuvent varier selon la complexité de votre dossier.";
    }
    else if (lowerMessage.contains("document")) {
      response = "📄 Documents nécessaires pour votre sinistre :\n\n✓ Constat amiable (obligatoire)\n✓ Photos des dégâts (plusieurs angles)\n✓ Carte grise du véhicule\n✓ Permis de conduire du conducteur\n✓ Relevé d'information assurance\n✓ Devis de réparation (si disponible)\n\nVous pouvez tout télécharger depuis votre espace client.";
    }
    else if (lowerMessage.contains("bonjour") || lowerMessage.contains("hello") || lowerMessage.equals("jjj") || lowerMessage.length() < 3) {
      response = "🤖 Bonjour ! Je suis votre assistant intelligent Salama. Je peux vous aider avec :\n\n✅ La déclaration de sinistre\n✅ Le suivi de votre dossier\n✅ Les documents nécessaires\n✅ Les informations sur l'expert\n✅ Les délais d'indemnisation\n✅ Les réclamations\n\nComment puis-je vous aider aujourd'hui ?";
    }
    else if (lowerMessage.contains("expert")) {
      response = "👨‍🔧 Votre expert est normalement assigné dans les 24h suivant la déclaration. Vous recevez ses coordonnées par email. Si ce n'est pas le cas, vous pouvez :\n\n• Vérifier vos spams\n• Contacter notre service client au 71 123 456\n• Consulter l'espace client pour voir l'expert assigné";
    }
    else if (lowerMessage.contains("indemnisation")) {
      response = "💰 Le calcul de votre indemnisation prend en compte :\n\n• Le montant des dommages estimés par l'expert\n• Votre franchise contractuelle\n• D'éventuelles remises (sentiment client positif)\n• Le rapport d'expertise final\n\nLe montant vous sera communiqué par email une fois le dossier validé.";
    }
    else if (lowerMessage.contains("déclarer")) {
      response = "🎯 Pour déclarer un sinistre :\n\n1️⃣ Connectez-vous à votre espace client\n2️⃣ Cliquez sur 'Nouvelle déclaration'\n3️⃣ Remplissez le formulaire avec les détails de l'accident\n4️⃣ Joignez les photos des dégâts\n5️⃣ Validez et soumettez\n\nUn expert sera assigné automatiquement sous 24h.";
    }
    else {
      response = "🤖 Je vous ai bien compris ! Pour vous aider au mieux, pourriez-vous préciser :\n\n• S'agit-il d'une déclaration de sinistre ?\n• Ou d'un suivi de dossier existant ?\n• Ou d'une question sur les documents/indemnisation ?\n\nVous pouvez aussi contacter notre service client au 71 123 456 pour une assistance personnalisée.";
    }

    return ChatResponse.builder()
      .message(response)
      .sender("bot")
      .timestamp(LocalDateTime.now())
      .intent("personalized")
      .build();
  }
}
