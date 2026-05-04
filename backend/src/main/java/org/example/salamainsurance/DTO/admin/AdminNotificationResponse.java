package org.example.salamainsurance.DTO.admin;

import org.example.salamainsurance.Entity.admin.AdminNotificationType;

import java.time.LocalDateTime;

public class AdminNotificationResponse {

    private Long id;
    private AdminNotificationType type;
    private String title;
    private String message;
    private Long relatedUserId;
    private LocalDateTime createdAt;
    private boolean read;

    public AdminNotificationResponse() {}

    public AdminNotificationResponse(Long id,
                                     AdminNotificationType type,
                                     String title,
                                     String message,
                                     Long relatedUserId,
                                     LocalDateTime createdAt,
                                     boolean read) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedUserId = relatedUserId;
        this.createdAt = createdAt;
        this.read = read;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public AdminNotificationType getType() {
        return type;
    }

    public void setType(AdminNotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getRelatedUserId() {
        return relatedUserId;
    }

    public void setRelatedUserId(Long relatedUserId) {
        this.relatedUserId = relatedUserId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}
