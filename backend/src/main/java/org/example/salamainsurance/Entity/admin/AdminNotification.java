package org.example.salamainsurance.Entity.admin;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Persistent admin-facing notification for user-management events.
 *
 * <p>This entity is dedicated to the admin user-management feature and is
 * intentionally kept separate from the teammate-owned {@code notifications}
 * table. It maps to its own {@code admin_notifications} table so the two
 * notification systems can evolve independently (no shared schema, no shared
 * enums, no migration coupling).
 */
@Entity
@Table(
        name = "admin_notifications",
        indexes = {
                @Index(name = "idx_admin_notifications_created_at", columnList = "created_at"),
                @Index(name = "idx_admin_notifications_is_read", columnList = "is_read")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 64)
    private AdminNotificationType type;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", nullable = false, length = 1024)
    private String message;

    /** Optional FK-by-id reference to the user the event is about. */
    @Column(name = "related_user_id")
    private Long relatedUserId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Whether an admin has already read this notification.
     * Stored as column {@code is_read} to avoid clashing with the SQL reserved
     * word {@code READ} on some databases.
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
