package org.example.salamainsurance.Service.admin;

import org.example.salamainsurance.DTO.admin.AdminNotificationResponse;
import org.example.salamainsurance.DTO.admin.PageResponse;
import org.example.salamainsurance.Entity.User;

public interface AdminNotificationService {

    /**
     * Records a {@code NEW_USER_REGISTERED} admin notification. Implementations
     * must never throw to the caller so registration is never broken by a
     * notification persistence failure.
     */
    void notifyNewUserRegistered(User user);

    /**
     * Records an {@code ACCOUNT_LOCKED} admin notification. Implementations
     * must never throw to the caller so failed-login bookkeeping is never
     * broken. Callers are expected to invoke this method only on the
     * unlocked → locked transition; this service does not de-duplicate
     * historical lock events on its own.
     */
    void notifyAccountLocked(User user);

    PageResponse<AdminNotificationResponse> list(int page, int size, boolean unreadOnly);

    long unreadCount();

    AdminNotificationResponse markAsRead(Long id);

    void markAllAsRead();
}
