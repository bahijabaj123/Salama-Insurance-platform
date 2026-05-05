package org.example.salamainsurance.Service.Notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.notification.NotificationEvent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

  private final JavaMailSender mailSender;

  @Value("${mail.from}")
  private String fromAddress;

  @Value("${mail.from-name}")
  private String fromName;

  @Value("${app.base-url}")
  private String baseUrl;

  @Value("${password.reset.base-url}")
  private String passwordResetBaseUrl;

  public EmailService(JavaMailSender mailSender) {
    this.mailSender = mailSender;
  }

  @Async
  public void sendVerificationEmail(String toEmail, String fullName, String token) {
    String verifyLink = baseUrl + "/api/auth/verify?token=" + token;

    String subject = "Verify your Salama Insurance account";
    String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <h2 style="color:#2c3e50">Welcome to Salama Insurance, %s!</h2>
                  <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                  <a href="%s"
                     style="display:inline-block;padding:12px 24px;background:#3498db;color:#fff;
                            text-decoration:none;border-radius:4px;margin:16px 0">
                     Verify My Account
                  </a>
                  <p style="color:#999;font-size:12px">If the button doesn't work, copy this link:<br>%s</p>
                  <hr style="border:none;border-top:1px solid #eee">
                  <p style="color:#aaa;font-size:11px">Salama Insurance Platform</p>
                </div>
                """.formatted(fullName, verifyLink, verifyLink);

    sendHtmlEmail(toEmail, subject, html);
  }

  @Async
  public void sendPasswordResetEmail(String toEmail, String fullName, String token) {
    String resetLink = passwordResetBaseUrl + "?token=" + token;

    String subject = "Reset your Salama Insurance password";
    String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                  <h2 style="color:#2c3e50">Hi %s,</h2>
                  <p>We received a request to reset your password. Click the button below to continue:</p>
                  <a href="%s"
                     style="display:inline-block;padding:12px 24px;background:#2ecc71;color:#fff;
                            text-decoration:none;border-radius:4px;margin:16px 0">
                     Reset Password
                  </a>
                  <p style="color:#999;font-size:12px">
                    If the button doesn't work, copy this link:<br>%s
                  </p>
                  <p style="color:#999;font-size:12px">
                    This link will expire soon. If you didn't request a password reset, you can safely ignore this email.
                  </p>
                  <hr style="border:none;border-top:1px solid #eee">
                  <p style="color:#aaa;font-size:11px">Salama Insurance Platform</p>
                </div>
                """.formatted(fullName, resetLink, resetLink);

    sendHtmlEmail(toEmail, subject, html);
  }

  public void sendSimpleTestEmail(String toEmail) {
    String subject = "Salama Insurance - SMTP Test";
    String html = """
                <div style="font-family:Arial,sans-serif">
                  <h3>SMTP Configuration Works!</h3>
                  <p>This is a test email from <strong>Salama Insurance Platform</strong>.</p>
                  <p>If you received this, your Gmail SMTP is correctly configured.</p>
                </div>
                """;

    sendHtmlEmail(toEmail, subject, html);
  }

  /**
   * Envoie un email simple (utilisé par le chatbot)
   */
  public void sendSimpleEmail(String to, String subject, String body) {
    String html = """
                <div style="font-family:Arial,sans-serif">
                  <h3>%s</h3>
                  <p>%s</p>
                  <hr style="border:none;border-top:1px solid #eee">
                  <p style="color:#aaa;font-size:11px">Salama Insurance Platform</p>
                </div>
                """.formatted(subject, body.replace("\n", "<br>"));

    sendHtmlEmail(to, subject, html);
  }

  /**
   * Envoie un email à partir d'un objet NotificationEvent
   */
  public void sendSimpleEmail(NotificationEvent event) {
    String subject = event.getSubject();
    String body = event.getContent();
    String to = event.getRecipientEmail();

    log.info("Sending email to: {} - Subject: {}", to, subject);
    sendSimpleEmail(to, subject, body);
  }

  private void sendHtmlEmail(String toEmail, String subject, String htmlBody) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
      helper.setFrom(fromAddress, fromName);
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(htmlBody, true);
      mailSender.send(message);
      log.info("Email sent successfully to {}", toEmail);
    } catch (MessagingException | java.io.UnsupportedEncodingException e) {
      log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
    }
  }
}
