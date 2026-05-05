package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String fullName;

    @Column(length = 255)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleName role;

    /** Requested professional role (ASSUREUR/EXPERT) while pending admin approval; null if not applicable. */
    @Enumerated(EnumType.STRING)
    private RoleName requestedRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @ColumnDefault("'APPROVED'")
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.APPROVED;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean locked = false;

    @Column(nullable = false)
    @ColumnDefault("0")
    @Builder.Default
    private int failedLoginAttempts = 0;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
