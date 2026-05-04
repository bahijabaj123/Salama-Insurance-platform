package org.example.salamainsurance.Service.Notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Fraud.FraudRule;
import org.example.salamainsurance.Entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EnhancedEmailService {

  @Autowired
  private JavaMailSender mailSender;

  @Autowired
  private TemplateEngine templateEngine;

  private final String fromEmail = "adsalamainsurance@gmail.com";

  // ============================================================
  // EXISTING METHODS
  // ============================================================

  public void sendExpertAssignmentEmail(ExpertHassen expert, Claim claim) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      Context context = new Context();
      context.setVariable("expertName", expert.getFirstName() + " " + expert.getLastName());
      context.setVariable("claimReference", claim.getReference());
      context.setVariable("region", claim.getRegion());
      context.setVariable("assignmentDate",
        claim.getAssignedDate() != null ?
          claim.getAssignedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) :
          "Date non disponible");
      context.setVariable("urgencyLevel",
        claim.getUrgencyScore() != null && claim.getUrgencyScore() > 70 ? "HIGH" :
          (claim.getUrgencyScore() != null && claim.getUrgencyScore() > 40 ? "MEDIUM" : "NORMAL"));

      if (claim.getAccident() != null) {
        context.setVariable("accidentLocation", claim.getAccident().getLocation());
        context.setVariable("accidentDate",
          claim.getAccident().getAccidentDate() != null ?
            claim.getAccident().getAccidentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) :
            "Date non disponible");
      }

      context.setVariable("dashboardLink", "http://localhost:4200/claims/" + claim.getId());

      String htmlContent = templateEngine.process("emails/expert-assignment", context);

      helper.setFrom(fromEmail);
      helper.setTo(expert.getEmail());
      helper.setSubject("[Salama Insurance] Nouvelle mission d'expertise - " + claim.getReference());
      helper.setText(htmlContent, true);

      mailSender.send(message);
      log.info("✅ Email HTML envoyé à l'expert {} avec template", expert.getEmail());

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi email template: {}", e.getMessage());
      throw new RuntimeException("Échec envoi email", e);
    }
  }

  public void sendClientNotificationEmail(String clientEmail, String clientName,
                                          Claim claim, String status, String message) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      Context context = new Context();
      context.setVariable("clientName", clientName);
      context.setVariable("status", status);
      context.setVariable("message", message);
      context.setVariable("claimReference", claim.getReference());

      String htmlContent = templateEngine.process("emails/client-notification", context);

      helper.setFrom(fromEmail);
      helper.setTo(clientEmail);
      helper.setSubject("[Salama Insurance] Mise à jour de votre sinistre " + claim.getReference());
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);
      log.info("✅ Email envoyé au client {}", clientEmail);

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi email client: {}", e.getMessage());
    }
  }

  public void sendFraudAlertEmail(String to, String riskLevel,
                                  String claimRef, int score,
                                  List<FraudRule> rules, String region) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      Context context = new Context();
      context.setVariable("riskLevel", riskLevel);
      context.setVariable("claimReference", claimRef);
      context.setVariable("fraudScore", score);
      context.setVariable("analysisDate",
        LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
      context.setVariable("region", region);
      context.setVariable("triggeredRules", rules);
      context.setVariable("dashboardLink", "http://localhost:4200/fraud/" + claimRef);
      context.setVariable("actionRequired",
        "HIGH".equals(riskLevel) ? "BLOQUER" : "VÉRIFIER");

      String template = "fraud-" + riskLevel.toLowerCase();
      String htmlContent = templateEngine.process("emails/" + template, context);

      String subject = riskLevel.equals("HIGH") ? "🔴 ALERTE FRAUDE CRITIQUE" :
        riskLevel.equals("MEDIUM") ? "🟠 RISQUE MOYEN DE FRAUDE" :
          "✅ Analyse de sinistre";

      helper.setFrom(fromEmail);
      helper.setTo(to);
      helper.setSubject(subject + " - " + claimRef);
      helper.setText(htmlContent, true);

      mailSender.send(message);
      log.info("✅ Email alerte fraude envoyé à {} pour sinistre {}", to, claimRef);

    } catch (Exception e) {
      log.error("❌ Erreur envoi email alerte: {}", e.getMessage());
    }
  }

  // ============================================================
  // NEW METHODS FOR ASSUREUR DASHBOARD
  // ============================================================

  /**
   * Envoi d'email personnalisé à un client pour mise à jour de sinistre
   */
  /*public void sendCustomClientNotification(String clientEmail, String clientName,
                                           Claim claim, String customMessage) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      Context context = new Context();
      context.setVariable("clientName", clientName);
      context.setVariable("claimReference", claim.getReference());
      context.setVariable("status", getStatusLabel(claim.getStatus().name()));
      context.setVariable("statusColor", getStatusColor(claim.getStatus().name()));
      context.setVariable("customMessage", customMessage);
      context.setVariable("region", claim.getRegion());
      context.setVariable("urgencyScore", claim.getUrgencyScore());
      context.setVariable("openingDate", claim.getOpeningDate() != null ?
        claim.getOpeningDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "Date non disponible");
      context.setVariable("dashboardLink", "http://localhost:4200/claims/" + claim.getId());
      context.setVariable("currentYear", LocalDateTime.now().getYear());

      String htmlContent = templateEngine.process("emails/custom-client-notification", context);

      helper.setFrom(fromEmail);
      helper.setTo(clientEmail);
      helper.setSubject("📋 Mise à jour de votre sinistre " + claim.getReference());
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);
      log.info("✅ Email personnalisé envoyé au client {} pour le sinistre {}", clientEmail, claim.getReference());

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi email personnalisé: {}", e.getMessage());
      throw new RuntimeException("Échec envoi email personnalisé", e);
    }
  }*/

  public void sendCustomClientNotification(String to, String clientName, Claim claim, String message) {
    log.info("Sending custom notification to: {}", to);
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      // ⭐ Construction HTML simple sans template
      String html = String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #185FA5; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; border: 1px solid #ddd; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Salama Insurance</h2>
                    </div>
                    <div class="content">
                        <h3>Dear %s,</h3>
                        <p>Your claim <strong>%s</strong> has been updated.</p>
                        <p><strong>Message:</strong> %s</p>
                        <br/>
                        <p>Best regards,<br/>Salama Insurance Team</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 Salama Insurance. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, clientName, claim.getReference(), message);

      helper.setFrom(fromEmail);
      helper.setTo(to);
      helper.setSubject("Update on your claim " + claim.getReference());
      helper.setText(html, true);

      mailSender.send(mimeMessage);
      log.info("✅ Email sent successfully to: {}", to);

    } catch (MessagingException e) {
      log.error("❌ Failed to send email: {}", e.getMessage());
      throw new RuntimeException("Email sending failed", e);
    }
  }

  /**
   * Envoi de notification push pour sinistre urgent
   */
  public void sendUrgentPushNotification(String clientEmail, String clientName,
                                         Claim claim) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      Context context = new Context();
      context.setVariable("clientName", clientName);
      context.setVariable("claimReference", claim.getReference());
      context.setVariable("urgencyScore", claim.getUrgencyScore());
      context.setVariable("region", claim.getRegion());
      context.setVariable("dashboardLink", "http://localhost:4200/claims/" + claim.getId());
      context.setVariable("contactPhone", "+216 70 123 456");
      context.setVariable("contactEmail", "support@salama.tn");
      context.setVariable("currentYear", LocalDateTime.now().getYear());

      String htmlContent = templateEngine.process("emails/urgent-push-notification", context);

      helper.setFrom(fromEmail);
      helper.setTo(clientEmail);
      helper.setSubject("🚨 URGENT - Votre sinistre " + claim.getReference() + " nécessite votre attention");
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);
      log.info("✅ Notification push urgente envoyée à {} pour le sinistre {}", clientEmail, claim.getReference());

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi notification push urgente: {}", e.getMessage());
      throw new RuntimeException("Échec envoi notification push", e);
    }
  }

  /**
   * Envoi d'email de bienvenue pour un nouveau client
   */
  public void sendWelcomeEmail(User user, String password) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      Context context = new Context();
      context.setVariable("clientName", user.getFullName());
      context.setVariable("email", user.getEmail());
      context.setVariable("password", password != null ? password : "Celui que vous avez défini lors de l'inscription");
      context.setVariable("loginLink", "http://localhost:4200/login");
      context.setVariable("dashboardLink", "http://localhost:4200/claims");
      context.setVariable("supportEmail", "support@salama.tn");
      context.setVariable("currentYear", LocalDateTime.now().getYear());

      String htmlContent = templateEngine.process("emails/welcome-email", context);

      helper.setFrom(fromEmail);
      helper.setTo(user.getEmail());
      helper.setSubject("Bienvenue chez Salama Insurance - Vos accès");
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);
      log.info("✅ Email de bienvenue envoyé à {}", user.getEmail());

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi email de bienvenue: {}", e.getMessage());
      throw new RuntimeException("Échec envoi email de bienvenue", e);
    }
  }

  /**
   * Envoi d'email de confirmation de création de sinistre
   */
  public void sendClaimCreationConfirmation(String clientEmail, String clientName,
                                            Claim claim) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      Context context = new Context();
      context.setVariable("clientName", clientName);
      context.setVariable("claimReference", claim.getReference());
      context.setVariable("openingDate", claim.getOpeningDate() != null ?
        claim.getOpeningDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "Date non disponible");
      context.setVariable("region", claim.getRegion());
      context.setVariable("trackingLink", "http://localhost:4200/claims/" + claim.getId());
      context.setVariable("supportPhone", "+216 70 123 456");
      context.setVariable("currentYear", LocalDateTime.now().getYear());

      String htmlContent = templateEngine.process("emails/claim-creation-confirmation", context);

      helper.setFrom(fromEmail);
      helper.setTo(clientEmail);
      helper.setSubject("✅ Votre sinistre " + claim.getReference() + " a été créé avec succès");
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);
      log.info("✅ Email de confirmation de sinistre envoyé à {}", clientEmail);

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi email de confirmation: {}", e.getMessage());
      throw new RuntimeException("Échec envoi email de confirmation", e);
    }
  }

  /**
   * Envoi d'email de relance pour sinistre en attente
   */
  public void sendPendingReminderEmail(String clientEmail, String clientName,
                                       Claim claim, int daysWaiting) {
    try {
      MimeMessage mimeMessage = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

      Context context = new Context();
      context.setVariable("clientName", clientName);
      context.setVariable("claimReference", claim.getReference());
      context.setVariable("daysWaiting", daysWaiting);
      context.setVariable("status", getStatusLabel(claim.getStatus().name()));
      context.setVariable("dashboardLink", "http://localhost:4200/claims/" + claim.getId());
      context.setVariable("supportEmail", "support@salama.tn");
      context.setVariable("currentYear", LocalDateTime.now().getYear());

      String htmlContent = templateEngine.process("emails/pending-reminder", context);

      helper.setFrom(fromEmail);
      helper.setTo(clientEmail);
      helper.setSubject("⏰ Rappel - Votre sinistre " + claim.getReference() + " est en cours de traitement");
      helper.setText(htmlContent, true);

      mailSender.send(mimeMessage);
      log.info("✅ Email de relance envoyé à {} pour le sinistre {}", clientEmail, claim.getReference());

    } catch (MessagingException e) {
      log.error("❌ Erreur envoi email de relance: {}", e.getMessage());
      throw new RuntimeException("Échec envoi email de relance", e);
    }
  }

  // ============================================================
  // PRIVATE UTILITY METHODS
  // ============================================================

  /**
   * Convertit un statut d'enum en libellé français
   */
  private String getStatusLabel(String status) {
    Map<String, String> statusLabels = new HashMap<>();
    statusLabels.put("OPENED", "Ouvert");
    statusLabels.put("ASSIGNED_TO_EXPERT", "Expert assigné");
    statusLabels.put("UNDER_EXPERTISE", "En expertise");
    statusLabels.put("CLOSED", "Clôturé");
    statusLabels.put("REJECTED", "Rejeté");
    return statusLabels.getOrDefault(status, status);
  }

  /**
   * Retourne la couleur CSS correspondant au statut
   */
  private String getStatusColor(String status) {
    Map<String, String> statusColors = new HashMap<>();
    statusColors.put("OPENED", "#185FA5");
    statusColors.put("ASSIGNED_TO_EXPERT", "#FF8C00");
    statusColors.put("UNDER_EXPERTISE", "#17a2b8");
    statusColors.put("CLOSED", "#3B6D11");
    statusColors.put("REJECTED", "#A32D2D");
    return statusColors.getOrDefault(status, "#6c757d");
  }
}
