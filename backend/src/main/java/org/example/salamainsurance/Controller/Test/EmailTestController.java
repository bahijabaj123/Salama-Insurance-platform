package org.example.salamainsurance.Controller.Test;

import org.example.salamainsurance.Service.Notification.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EmailTestController {

  @Autowired
  private EmailService emailService;

  @GetMapping("/test-email")
  public String testGmail(@RequestParam String to,
                          @RequestParam String subject,
                          @RequestParam String body) {
    try {
      emailService.sendSimpleEmail(to, subject, body);
      return "Email envoyé avec succès via Gmail à " + to;
    } catch (Exception e) {
      return "Erreur : " + e.getMessage();
    }
  }
}
