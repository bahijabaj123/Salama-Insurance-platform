package org.example.salamainsurance.Service.admin;

import org.example.salamainsurance.DTO.admin.AdminNotificationResponse;
import org.example.salamainsurance.DTO.admin.PageResponse;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Entity.admin.AdminNotification;
import org.example.salamainsurance.Entity.admin.AdminNotificationType;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.admin.AdminNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminNotificationServiceImpl implements AdminNotificationService {

    private static final Logger log = LoggerFactory.getLogger(AdminNotificationServiceImpl.class);

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    private final AdminNotificationRepository repository;

    public AdminNotificationServiceImpl(AdminNotificationRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void notifyNewUserRegistered(User user) {
        if (user == null) {
            return;
        }
        try {
            String fullName = user.getFullName() != null ? user.getFullName() : user.getEmail();
            String roleLabel = user.getRole() != null ? user.getRole().name() : "UNKNOWN";
            AdminNotification notification = AdminNotification.builder()
                    .type(AdminNotificationType.NEW_USER_REGISTERED)
                    .title("New user registered")
                    .message(fullName + " registered as " + roleLabel)
                    .relatedUserId(user.getId())
                    .read(false)
                    .build();
            repository.save(notification);
        } catch (Exception e) {
            // Never break registration because of a notification side-effect.
            log.error("Failed to record NEW_USER_REGISTERED admin notification for userId={}: {}",
                    user.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional
    public void notifyAccountLocked(User user) {
        if (user == null) {
            return;
        }
        try {
            String email = user.getEmail() != null ? user.getEmail() : "(unknown)";
            AdminNotification notification = AdminNotification.builder()
                    .type(AdminNotificationType.ACCOUNT_LOCKED)
                    .title("Account locked")
                    .message(email + " was locked after 3 failed login attempts")
                    .relatedUserId(user.getId())
                    .read(false)
                    .build();
            repository.save(notification);
        } catch (Exception e) {
            // Never break the login-attempt bookkeeping path.
            log.error("Failed to record ACCOUNT_LOCKED admin notification for userId={}: {}",
                    user.getId(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminNotificationResponse> list(int page, int size, boolean unreadOnly) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                clamp(size, 1, MAX_PAGE_SIZE)
        );

        Page<AdminNotification> result = unreadOnly
                ? repository.findByReadFalseOrderByCreatedAtDesc(pageable)
                : repository.findAllByOrderByCreatedAtDesc(pageable);

        List<AdminNotificationResponse> content = result.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public long unreadCount() {
        return repository.countByReadFalse();
    }

    @Override
    @Transactional
    public AdminNotificationResponse markAsRead(Long id) {
        AdminNotification notification = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification = repository.save(notification);
        }
        return toResponse(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        repository.markAllAsRead();
    }

    static int clamp(int value, int min, int max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    /**
     * Public so the controller can apply the same defaulting/clamping policy
     * for the {@code size} query param.
     */
    public static int normalizePageSize(Integer size) {
        if (size == null) {
            return DEFAULT_PAGE_SIZE;
        }
        return clamp(size, 1, MAX_PAGE_SIZE);
    }

    private AdminNotificationResponse toResponse(AdminNotification n) {
        return new AdminNotificationResponse(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getRelatedUserId(),
                n.getCreatedAt(),
                n.isRead()
        );
    }
}
