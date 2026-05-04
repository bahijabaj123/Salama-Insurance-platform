package org.example.salamainsurance.Entity.notification;

import lombok.Builder;
import lombok.Data;
import java.util.Map;

@Data
@Builder
public class NotificationEvent {
  private Long claimId;
  private String claimReference;
  private RecipientType recipientType;
  private Long recipientId;
  private String recipientEmail;
  private String recipientPhone;
  private String recipientName;
  private NotificationChannel channel;
  private NotificationType type;
  private String subject;
  private String content;
  private UrgencyLevel urgency;
  private Map<String, Object> additionalData;
}
