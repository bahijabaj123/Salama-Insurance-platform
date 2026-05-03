package org.example.salamainsurance.security;

import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("rbacSecurity")
public class RbacSecurity {

    private final UserRepository userRepository;

    public RbacSecurity(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public boolean hasUserId(Long userId, Authentication authentication) {
        String email = authentication.getName(); // subject du JWT

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return user.getId().equals(userId);
    }
}