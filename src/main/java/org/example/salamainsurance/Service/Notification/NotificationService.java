package org.example.salamainsurance.Service.Notification;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.Notification.*;
import org.example.salamainsurance.Entity.Report.Driver;
import org.example.salamainsurance.Repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Slf4j
public class NotificationService {

  @Autowired
  private NotificationRepository notificationRepository;

  @Autowired
  private EmailService emailService;

  @Autowired
  private SmsService smsService;

  @Transactional
  public void sendNotification(NotificationEvent event) {

    // 1. Créer et sauvegarder l'entité
    Notification notification = new Notification();
    notification.setClaimId(event.getClaimId());
    notification.setClaimReference(event.getClaimReference());
    notification.setRecipientType(event.getRecipientType());
    notification.setRecipientId(event.getRecipientId());
    notification.setRecipientEmail(event.getRecipientEmail());
    notification.setRecipientPhone(event.getRecipientPhone());
    notification.setRecipientName(event.getRecipientName());
    notification.setChannel(event.getChannel());
    notification.setType(event.getType());
    notification.setSubject(event.getSubject());
    notification.setContent(event.getContent());
    notification.setStatus(NotificationStatus.PENDING);

    notification = notificationRepository.save(notification);

    try {
      // 2. Envoyer selon le canal
      boolean sent = false;

      if (event.getChannel() == NotificationChannel.EMAIL ||
        event.getChannel() == NotificationChannel.ALL) {
        emailService.sendSimpleEmail(event);
        sent = true;
      }

      if (event.getChannel() == NotificationChannel.SMS ||
        event.getChannel() == NotificationChannel.ALL) {
        smsService.sendSms(event);
        sent = true;
      }

      // 3. Mettre à jour le statut
      if (sent) {
        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
      }

    } catch (Exception e) {
      log.error("Failed to send notification: {}", e.getMessage());
      notification.setStatus(NotificationStatus.FAILED);
      notification.setErrorMessage(e.getMessage());
      notification.setRetryCount(notification.getRetryCount() + 1);
      notification.setNextRetryAt(LocalDateTime.now().plusHours(1));
    }

    notificationRepository.save(notification);
  }

  // Méthode pour envoyer à un expert (compatible avec ton ancien code)
  public void sendToExpert(org.example.salamainsurance.Entity.ExpertManagement.Expert expert, String message) {
    NotificationEvent event = NotificationEvent.builder()
      .recipientType(RecipientType.EXPERT)
      .recipientId(expert.getId())
      .recipientEmail(expert.getEmail())
      .recipientPhone(expert.getPhoneNumber())
      .recipientName(expert.getFirstName() + " " + expert.getLastName())
      .channel(NotificationChannel.EMAIL)
      .type(NotificationType.INFO_REQUEST)
      .subject("Notification Salama Insurance")
      .content(message)
      .urgency(UrgencyLevel.NORMAL)
      .build();

    sendNotification(event);
  }

  // Méthode pour envoyer à un assureur
  public void sendToInsurer(org.example.salamainsurance.Entity.ClaimManagement.Insurer insurer, String message) {
    NotificationEvent event = NotificationEvent.builder()
      .recipientType(RecipientType.INSURER)
      .recipientId(insurer.getId())
      .recipientEmail(insurer.getEmail())
      .recipientName(insurer.getFirstName() + " " + insurer.getLastName())
      .channel(NotificationChannel.EMAIL)
      .type(NotificationType.SYSTEM_ALERT)
      .subject("Notification Salama Insurance - Assureur")
      .content(message)
      .urgency(UrgencyLevel.NORMAL)
      .build();

    sendNotification(event);
  }


  public void sendToClient(org.example.salamainsurance.Entity.Report.Driver client, String message) {
    NotificationEvent event = NotificationEvent.builder()
      .recipientType(RecipientType.CLIENT)
      .recipientId(client.getId())
      .recipientEmail(client.getEmail())
      .recipientPhone(client.getPhoneNumber())
      .recipientName(client.getName())
      .channel(NotificationChannel.EMAIL)
      .type(NotificationType.INFO_REQUEST)
      .subject("Salama Insurance - Information sinistre")
      .content(message)
      .urgency(UrgencyLevel.NORMAL)
      .build();

    sendNotification(event);

  }}
