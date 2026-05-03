package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Entity.VerificationToken;
import org.example.salamainsurance.Exception.InvalidTokenException;
import org.example.salamainsurance.Repository.UserRepository;
import org.example.salamainsurance.Repository.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
public class VerificationTokenService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;

    @Value("${verification.token.expiry-hours:24}")
    private int expiryHours;

    public VerificationTokenService(VerificationTokenRepository tokenRepository,
                                    UserRepository userRepository) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
    }

    public String createTokenForUser(User user) {
        String rawToken = generateSecureToken();
        String hash = hashToken(rawToken);

        VerificationToken token = VerificationToken.builder()
                .tokenHash(hash)
                .expiresAt(LocalDateTime.now().plusHours(expiryHours))
                .used(false)
                .user(user)
                .build();

        tokenRepository.save(token);
        return rawToken;
    }

    @Transactional
    public void verifyToken(String rawToken) {
        String hash = hashToken(rawToken);

        VerificationToken token = tokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired token"));

        if (token.isUsed()) {
            throw new InvalidTokenException("Invalid or expired token");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Invalid or expired token");
        }

        token.setUsed(true);
        tokenRepository.save(token);

        User user = token.getUser();
        user.setEnabled(true);
        userRepository.save(user);
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
}
