package org.example.salamainsurance.DTO;

import lombok.Builder;
import lombok.Data;
import org.example.salamainsurance.Entity.Notification.NotificationType;
import org.example.salamainsurance.Entity.Notification.UrgencyLevel;

import java.util.Map;

@Data
@Builder
public class NotificationEvent {
  private Long claimId;
  private String claimReference;
  private NotificationType type;
  private UrgencyLevel urgency;
  private String recipientEmail;
  private String recipientPhone;
  private String recipientName;
  private Map<String, Object> additionalData;
}
