// EmailController.java
package org.example.salamainsurance.Controller;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.DTO.EmailRequest;
import org.example.salamainsurance.Service.Notification.EnhancedEmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class EmailController {

  private final EnhancedEmailService emailService;

  @PostMapping("/send-claim-update")
  public ResponseEntity<String> sendClaimUpdate(@RequestBody Map<String, String> request) {
    String to = request.get("to");
    String claimReference = request.get("claimReference");
    String status = request.get("status");
    String message = request.get("message");

    // Appeler le service
    emailService.sendCustomClientNotification(to, extractClientName(to), null, message);
    return ResponseEntity.ok("Email envoyé");
  }


  @PostMapping("/send-urgent-notification")
  public ResponseEntity<String> sendUrgentNotification(@RequestBody EmailRequest request) {
    // À implémenter
    return ResponseEntity.ok("Notification envoyée");
  }

  private String extractClientName(String email) {
    return email.split("@")[0];
  }

  @PostMapping("/test")
  public ResponseEntity<String> testEmail(@RequestBody Map<String, String> request) {
    System.out.println("=== TEST EMAIL ===");
    System.out.println("To: " + request.get("to"));
    System.out.println("Message: " + request.get("message"));
    return ResponseEntity.ok("Test OK - Email non envoyé réellement");
  }

}
