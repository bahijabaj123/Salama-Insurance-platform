package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.PasswordResetToken;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Exception.InvalidTokenException;
import org.example.salamainsurance.Repository.PasswordResetTokenRepository;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class PasswordResetService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${password.reset.token.expiry-minutes:30}")
    private int expiryMinutes;

    public PasswordResetService(PasswordResetTokenRepository passwordResetTokenRepository,
                                UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Generates a password reset token for the user if the email exists.
     * The caller must always return a neutral response to avoid account enumeration.
     *
     * @return a payload containing raw token and basic recipient info, or empty if no user found
     */
    @Transactional
    public Optional<PasswordResetEmailPayload> requestPasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();

        // Invalidate any existing active reset tokens for this user
        passwordResetTokenRepository.invalidateActiveTokensForUser(user.getId(), LocalDateTime.now());

        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(expiryMinutes))
                .used(false)
                .user(user)
                .build();

        passwordResetTokenRepository.save(token);

        return Optional.of(new PasswordResetEmailPayload(user.getEmail(), user.getFullName(), rawToken));
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hashToken(rawToken);

        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired token"));

        if (token.isUsed()) {
            throw new InvalidTokenException("Invalid or expired token");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Invalid or expired token");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        // Defensive: invalidate any other still-active tokens for the same user
        passwordResetTokenRepository.invalidateActiveTokensForUser(user.getId(), LocalDateTime.now());
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public record PasswordResetEmailPayload(String toEmail, String fullName, String rawToken) {
    }
}

