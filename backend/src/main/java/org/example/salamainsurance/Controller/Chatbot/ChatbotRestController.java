// Controller/ChatbotRestController.java
package org.example.salamainsurance.Controller.Chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.DTO.ChatRequest;
import org.example.salamainsurance.DTO.ChatResponse;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.example.salamainsurance.Service.Chatbot.HuggingFaceChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
public class ChatbotRestController {

  private final HuggingFaceChatService chatService;
  private final UserRepository userRepository;

  @PostMapping("/message")
  public ResponseEntity<ChatResponse> sendMessage(
    @RequestBody ChatRequest request,
    @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

    // Récupérer l'utilisateur depuis l'email dans le header
    // Si pas de header, utiliser un utilisateur par défaut pour les tests
    String email = userEmail != null ? userEmail : "client@salama.tn";

    log.info("=== AUTHENTIFICATION VIA HEADER ===");
    log.info("Email reçu dans header X-User-Email: {}", email);

    // Chercher l'utilisateur dans la base
    Optional<User> userOpt = userRepository.findByEmail(email);

    User currentUser;
    if (userOpt.isPresent()) {
      currentUser = userOpt.get();
      log.info("✅ Utilisateur trouvé: {} - Rôle: {}", currentUser.getFullName(), currentUser.getRole());
    } else {
      // Si l'utilisateur n'existe pas, le créer automatiquement
      log.warn("⚠️ Utilisateur non trouvé, création automatique...");
      currentUser = createUser(email);
    }

    log.info("Message reçu: {}", request.getMessage());

    // Traiter le message avec l'utilisateur authentifié
    ChatResponse response = chatService.processMessage(request, currentUser);
    return ResponseEntity.ok(response);
  }

  /**
   * Crée un utilisateur automatiquement s'il n'existe pas
   */
  private User createUser(String email) {
    // Déterminer le rôle en fonction de l'email (pour les tests)
    RoleName role = determineRoleFromEmail(email);

    String fullName = extractNameFromEmail(email);

    User newUser = User.builder()
      .email(email)
      .fullName(fullName)
      .role(role)
      .enabled(true)
      .locked(false)
      .createdAt(LocalDateTime.now())
      .updatedAt(LocalDateTime.now())
      .build();

    return userRepository.save(newUser);
  }

  /**
   * Détermine le rôle en fonction de l'email (pour les tests)
   */
  private RoleName determineRoleFromEmail(String email) {
    if (email.contains("expert")) {
      return RoleName.EXPERT;
    } else if (email.contains("assureur") || email.contains("insurer")) {
      return RoleName.ASSUREUR;
    } else if (email.contains("admin")) {
      return RoleName.ADMIN;
    } else {
      return RoleName.CLIENT;
    }
  }

  /**
   * Extrait le nom depuis l'email (ex: client@salama.tn -> Client)
   */
  private String extractNameFromEmail(String email) {
    String name = email.split("@")[0];
    return name.substring(0, 1).toUpperCase() + name.substring(1);
  }

  @GetMapping("/test")
  public ResponseEntity<String> test() {
    return ResponseEntity.ok("✅ Chatbot API is working!");
  }

  @GetMapping("/users")
  public ResponseEntity<?> getUsers() {
    return ResponseEntity.ok(userRepository.findAll());
  }
}
