package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Service.Notification.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dev")
public class DevController {

    private final EmailService emailService;

    public DevController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/test-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> sendTestEmail(@RequestParam String to) {
        emailService.sendSimpleTestEmail(to);
        return ResponseEntity.ok(Map.of("message", "Test email sent to " + to));
    }
}
