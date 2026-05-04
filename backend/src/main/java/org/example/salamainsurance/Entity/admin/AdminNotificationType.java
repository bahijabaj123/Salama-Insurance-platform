package org.example.salamainsurance.Entity.admin;

/**
 * Categorises an {@link AdminNotification}. Kept intentionally small and
 * isolated from the teammate-owned {@code Entity/notification/} module so the
 * two notification systems never need to share types or migrations.
 */
public enum AdminNotificationType {
    NEW_USER_REGISTERED,
    ACCOUNT_LOCKED
}
