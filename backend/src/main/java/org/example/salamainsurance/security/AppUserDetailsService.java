package org.example.salamainsurance.security;

import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // Email verification (enabled) and lock checks are enforced by Spring based on the UserDetails flags below.
        // Business approval must be enforced explicitly to keep it separate from email verification.
        if ((user.getRole() == RoleName.ASSUREUR || user.getRole() == RoleName.EXPERT)
                && user.getApprovalStatus() != ApprovalStatus.APPROVED) {
            if (user.getApprovalStatus() == ApprovalStatus.PENDING) {
                throw new PendingApprovalException("Account pending admin approval");
            }
            if (user.getApprovalStatus() == ApprovalStatus.REJECTED) {
                throw new RejectedApprovalException("Role request rejected by admin");
            }
        }

        String password = user.getPassword() != null ? user.getPassword() : "";

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                password,
                user.isEnabled(),
                true,
                true,
                !user.isLocked(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
