package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.example.salamainsurance.Service.admin.AdminNotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginAttemptService {

    private static final int MAX_FAILED_ATTEMPTS_BEFORE_LOCK = 3;

    private final UserRepository userRepository;
    private final AdminNotificationService adminNotificationService;

    public LoginAttemptService(UserRepository userRepository,
                               AdminNotificationService adminNotificationService) {
        this.userRepository = userRepository;
        this.adminNotificationService = adminNotificationService;
    }

    /**
     * Records a failed password attempt for classic login only.
     * No-op if the user does not exist or is already locked, which guarantees
     * that the unlocked → locked transition (and therefore the
     * {@code ACCOUNT_LOCKED} admin notification) fires at most once per lock
     * event.
     */
    @Transactional
    public void recordFailedPasswordAttempt(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.isLocked()) {
            return;
        }
        int next = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(next);
        boolean justLocked = false;
        if (next >= MAX_FAILED_ATTEMPTS_BEFORE_LOCK) {
            user.setLocked(true);
            justLocked = true;
        }
        User saved = userRepository.save(user);
        if (justLocked) {
            // Only fired on the unlocked -> locked transition; the early return
            // above prevents this branch from being reached again until an
            // admin unlocks the account.
            adminNotificationService.notifyAccountLocked(saved);
        }
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
