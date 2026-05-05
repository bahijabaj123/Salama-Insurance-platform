package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginAttemptService {

    private static final int MAX_FAILED_ATTEMPTS_BEFORE_LOCK = 3;

    private final UserRepository userRepository;

    public LoginAttemptService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Records a failed password attempt for classic login only.
     * No-op if the user does not exist or is already locked.
     */
    @Transactional
    public void recordFailedPasswordAttempt(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isLocked()) {
            return;
        }
        int next = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(next);
        if (next >= MAX_FAILED_ATTEMPTS_BEFORE_LOCK) {
            user.setLocked(true);
        }
        userRepository.save(user);
    }

    @Transactional
    public void resetAttemptsOnSuccessfulLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getFailedLoginAttempts() != 0) {
                user.setFailedLoginAttempts(0);
                userRepository.save(user);
            }
        });
    }
}
