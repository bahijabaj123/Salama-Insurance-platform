// EmailController.java
package org.example.salamainsurance.Controller;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.DTO.EmailRequest;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Service.ClaimManagement.ClaimService;
import org.example.salamainsurance.Service.Notification.EmailService;
import org.example.salamainsurance.Service.Notification.EnhancedEmailService;
import org.example.salamainsurance.Service.Notification.SmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
import org.springframework.mail.javamail.JavaMailSender;


@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:4200")
public class EmailController {

  private final EnhancedEmailService emailService;
private final ClaimService claimService ;
  private final JavaMailSender mailSender;

  @PostMapping("/send-claim-update")
  public ResponseEntity<String> sendClaimUpdate(@RequestBody Map<String, String> request) {
    try {
      String to = request.get("to");
      String claimReference = request.get("claimReference");
      String status = request.get("status");
      String message = request.get("message");
      String clientName = request.get("clientName");

      if (clientName == null || clientName.isEmpty()) {
        clientName = "Customer";
      }

      String htmlContent = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #185FA5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Salama Insurance</h2>
                    </div>
                    <div class="content">
                        <h3>Hello %s,</h3>
                        <p>Your claim <strong>%s</strong> has been updated.</p>
                        <p><strong>Status:</strong> %s</p>
                        <p><strong>Message:</strong> %s</p>
                        <br/>
                        <p>Best regards,<br/>Salama Insurance Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Salama Insurance</p>
                    </div>
                </div>
            </body>
            </html>
            """, clientName, claimReference, status, message);

      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
      helper.setFrom("adsalamainsurance@gmail.com");
      helper.setTo(to);
      helper.setSubject("Claim Update - " + claimReference);
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);

      return ResponseEntity.ok("Email sent successfully to: " + to);

    } catch (Exception e) {
      log.error("Error sending email: {}", e.getMessage());
      return ResponseEntity.status(500).body("Error: " + e.getMessage());
    }
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




  @PostMapping("/notify-client")
  public ResponseEntity<String> notifyClient(@RequestBody Map<String, Object> payload) {
    try {
      System.out.println("=== NOTIFY CLIENT ===");
      System.out.println("Payload: " + payload);

      String to = (String) payload.get("to");
      String claimReference = (String) payload.get("claimReference");
      String message = (String) payload.get("message");
      String clientName = (String) payload.get("clientName");

      // Récupérer le claim depuis la base
      Claim claim = claimService.getClaimByReference(claimReference);

      // Utiliser le service d'email
      emailService.sendCustomClientNotification(to, clientName, claim, message);

      return ResponseEntity.ok("Email sent to: " + to);

    } catch (Exception e) {
      log.error("Error sending email: {}", e.getMessage());

      return ResponseEntity.status(500).body("Error: " + e.getMessage());
    }
  }

}
