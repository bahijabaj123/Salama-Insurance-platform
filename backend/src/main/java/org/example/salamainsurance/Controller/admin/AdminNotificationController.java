package org.example.salamainsurance.Controller.admin;

import org.example.salamainsurance.DTO.admin.AdminNotificationResponse;
import org.example.salamainsurance.DTO.admin.PageResponse;
import org.example.salamainsurance.DTO.admin.UnreadNotificationCountResponse;
import org.example.salamainsurance.Service.admin.AdminNotificationService;
import org.example.salamainsurance.Service.admin.AdminNotificationServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final AdminNotificationService adminNotificationService;

    public AdminNotificationController(AdminNotificationService adminNotificationService) {
        this.adminNotificationService = adminNotificationService;
    }

    /**
     * Paginated list of admin notifications, newest first.
     *
     * @param page       0-based page index, defaults to 0
     * @param size       page size, defaults to 10 and is clamped to {@code [1, 100]}
     * @param unreadOnly when true, only unread notifications are returned
     */
    @GetMapping
    public ResponseEntity<PageResponse<AdminNotificationResponse>> list(
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false) Integer size,
            @RequestParam(value = "unreadOnly", required = false, defaultValue = "false") boolean unreadOnly) {
        int normalizedSize = AdminNotificationServiceImpl.normalizePageSize(size);
        return ResponseEntity.ok(adminNotificationService.list(Math.max(page, 0), normalizedSize, unreadOnly));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadNotificationCountResponse> unreadCount() {
        return ResponseEntity.ok(new UnreadNotificationCountResponse(adminNotificationService.unreadCount()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<AdminNotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(adminNotificationService.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        adminNotificationService.markAllAsRead();
        return ResponseEntity.ok(Collections.singletonMap("message", "All notifications marked as read."));
    }
}
