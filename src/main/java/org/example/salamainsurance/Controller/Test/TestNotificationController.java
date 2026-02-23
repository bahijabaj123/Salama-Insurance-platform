package org.example.salamainsurance.Controller.Test;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ExpertManagement.Expert;
import org.example.salamainsurance.Repository.ExpertRepo.ExpertRepository;
import org.example.salamainsurance.Service.ClaimManagement.ClaimService;
import org.example.salamainsurance.Service.Notification.NotificationService;
import org.example.salamainsurance.Service.Notification.EnhancedEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test/notifications")
public class TestNotificationController {

  @Autowired
  private NotificationService notificationService;

  @Autowired
  private EnhancedEmailService enhancedEmailService;

  @Autowired
  private ExpertRepository expertRepository;

  @Autowired
  private ClaimService claimService;

  // ✅ Test template avec ResponseEntity
  @GetMapping("/test-template/{expertId}/{claimId}")
  public ResponseEntity<?> testTemplate(
    @PathVariable Long expertId,
    @PathVariable Long claimId) {
    try {
      Expert expert = expertRepository.findById(expertId)
        .orElseThrow(() -> new RuntimeException("Expert not found"));

      Claim claim = claimService.getClaimById(claimId);

      enhancedEmailService.sendExpertAssignmentEmail(expert, claim);

      Map<String, String> response = new HashMap<>();
      response.put("status", "success");
      response.put("message", "template email envoyé à " + expert.getEmail());
      response.put("expert", expert.getFirstName() + " " + expert.getLastName());
      response.put("claim", claim.getReference());

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      Map<String, String> error = new HashMap<>();
      error.put("status", "error");
      error.put("message", " " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
  }

  @GetMapping("/test-client-template")
  public ResponseEntity<?> testClientTemplate(
    @RequestParam String clientEmail,
    @RequestParam String clientName,
    @RequestParam Long claimId) {
    try {
      Claim claim = claimService.getClaimById(claimId);

      String status = claim.getStatus().toString();
      String message = "Votre sinistre a été mis à jour. Un expert vous contactera bientôt.";

      enhancedEmailService.sendClientNotificationEmail(
        clientEmail,
        clientName,
        claim,
        status,
        message
      );

      Map<String, String> response = new HashMap<>();
      response.put("status", "success");
      response.put("message", " Template client envoyé à " + clientEmail);
      response.put("claim", claim.getReference());
      response.put("client", clientName);

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      Map<String, String> error = new HashMap<>();
      error.put("status", "error");
      error.put("message", " " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
  }
  // Test simple (String)
  @GetMapping("/test-simple/{expertId}")
  public String testSimple(@PathVariable Long expertId, @RequestParam String message) {
    try {
      Expert expert = expertRepository.findById(expertId)
        .orElseThrow(() -> new RuntimeException("Expert not found"));

      notificationService.sendToExpert(expert, message);

      return "✅ Notification envoyée à " + expert.getEmail();

    } catch (Exception e) {
      return "❌ Erreur: " + e.getMessage();
    }
  }
}
