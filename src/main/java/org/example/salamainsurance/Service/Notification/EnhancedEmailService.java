package org.example.salamainsurance.Service.Notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;  // ← CORRIGÉ
import org.example.salamainsurance.Entity.Fraud.FraudRule;
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

  public void sendExpertAssignmentEmail(ExpertHassen  expert, Claim claim) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      // Préparer le contexte pour le template
      Context context = new Context();
      context.setVariable("expertName", expert.getFirstName() + " " + expert.getLastName());
      context.setVariable("claimReference", claim.getReference());
      context.setVariable("region", claim.getRegion());
     // context.setVariable("damageType", claim.getDamageType() != null ? claim.getDamageType() : "Non spécifié");
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
        //context.setVariable("damageDescription",
          //claim.getAccident().getDamageDescription() != null ?
          //  claim.getAccident().getDamageDescription() : "Non spécifié");
      }

      context.setVariable("dashboardLink", "http://localhost:8082/claims/" + claim.getId());

      // Générer le contenu HTML
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
      context.setVariable("triggeredRules", rules);  // ← C'EST ICI QUE LES RÈGLES SONT PASSÉES
      context.setVariable("dashboardLink", "http://localhost:8082/fraud/" + claimRef);
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

}
