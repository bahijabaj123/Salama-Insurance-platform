package org.example.salamainsurance.Controller;

import jakarta.validation.Valid;
import org.example.salamainsurance.DTO.ForgotPasswordRequest;
import org.example.salamainsurance.DTO.ResetPasswordRequest;
import org.example.salamainsurance.Service.Notification.EmailService;
import org.example.salamainsurance.Service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetController.class);

    private final PasswordResetService passwordResetService;
    private final EmailService emailService;

    public PasswordResetController(PasswordResetService passwordResetService,
                                   EmailService emailService) {
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<PasswordResetService.PasswordResetEmailPayload> payload =
                passwordResetService.requestPasswordReset(request.getEmail());

        if (payload.isPresent()) {
            PasswordResetService.PasswordResetEmailPayload p = payload.get();
            try {
                emailService.sendPasswordResetEmail(p.toEmail(), p.fullName(), p.rawToken());
            } catch (Exception e) {
                // Never log the raw token or reveal account existence; keep logs minimal.
                log.error("Failed to send password reset email: {}", e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "If an account with that email exists, a reset link has been sent."
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }
}

