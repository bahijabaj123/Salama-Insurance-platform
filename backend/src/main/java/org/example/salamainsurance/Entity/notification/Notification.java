package org.example.salamainsurance.Entity.notification;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "claim_id")
  private Long claimId;  // Peut être null pour les notifications système

  @Column(name = "claim_reference")
  private String claimReference;

  @Enumerated(EnumType.STRING)
  @Column(name = "recipient_type", nullable = false)
  private RecipientType recipientType;  // CLIENT, EXPERT, INSURER

  @Column(name = "recipient_id", nullable = false)
  private Long recipientId;

  @Column(name = "recipient_email")
  private String recipientEmail;

  @Column(name = "recipient_phone")
  private String recipientPhone;

  @Column(name = "recipient_name")
  private String recipientName;

  @Enumerated(EnumType.STRING)
  @Column(name = "channel", nullable = false)
  private NotificationChannel channel;  // EMAIL, SMS, PUSH

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false)
  private NotificationType type;  // ASSIGNMENT, REMINDER, ALERT, etc.

  @Column(name = "subject")
  private String subject;

  @Column(name = "content", length = 2000)
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private NotificationStatus status;  // PENDING, SENT, FAILED

  @Column(name = "sent_at")
  private LocalDateTime sentAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "error_message", length = 500)
  private String errorMessage;

  @Column(name = "retry_count")
  private Integer retryCount = 0;

  @Column(name = "next_retry_at")
  private LocalDateTime nextRetryAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    if (retryCount == null) {
      retryCount = 0;
    }
  }
}
