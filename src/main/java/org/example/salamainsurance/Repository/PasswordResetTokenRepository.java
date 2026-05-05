package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying
    @Query("""
            update PasswordResetToken t
               set t.used = true
             where t.user.id = :userId
               and t.used = false
               and t.expiresAt > :now
            """)
    int invalidateActiveTokensForUser(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}

