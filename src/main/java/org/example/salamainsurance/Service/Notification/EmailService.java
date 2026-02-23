package org.example.salamainsurance.Service.Notification;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.Notification.NotificationEvent;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;


@Service
@Slf4j
public class EmailService {

  @Autowired
  private JavaMailSender javaMailSender;

  /*
    public void sendEmail(NotificationEvent event) {
      // Simulation d'envoi d'email
      log.info("📧 EMAIL envoyé à: {}", event.getRecipientEmail());
      log.info("Sujet: {}", event.getSubject());
      log.info("Message: {}", event.getContent());

      // Ici tu mettras le vrai code avec JavaMailSender
    */
  public void sendSimpleEmail(String to, String subject, String body) {

  }


  public void sendSimpleEmail(NotificationEvent event) {
  }
}

