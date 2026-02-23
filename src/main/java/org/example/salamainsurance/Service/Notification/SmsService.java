package org.example.salamainsurance.Service.Notification;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.Notification.NotificationEvent;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class SmsService {

  public void sendSms(NotificationEvent event) {
    // Simulation d'envoi SMS
    log.info("📱 SMS envoyé à: {}", event.getRecipientPhone());
    log.info("Message: {}", event.getContent());

    // Ici tu mettras le vrai code avec Twilio ou autre
  }
}
