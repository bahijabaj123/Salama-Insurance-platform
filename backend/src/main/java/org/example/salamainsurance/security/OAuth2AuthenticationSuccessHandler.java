package org.example.salamainsurance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.salamainsurance.DTO.AuthResponse;
import org.example.salamainsurance.DTO.UserResponse;
import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository,
                                             JwtService jwtService,
                                             ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .fullName(name != null ? name : email)
                            .role(RoleName.CLIENT)
                            .requestedRole(null)
                            .approvalStatus(ApprovalStatus.APPROVED)
                            .enabled(true)
                            .locked(false)
                            .failedLoginAttempts(0)
                            .build();
                    return userRepository.save(newUser);
                });

        String token = jwtService.generateToken(user.getEmail());

        UserResponse userResponse = new UserResponse();
        userResponse.setId(user.getId());
        userResponse.setEmail(user.getEmail());
        userResponse.setFullName(user.getFullName());
        userResponse.setRole(user.getRole());
        userResponse.setRequestedRole(user.getRequestedRole());
        userResponse.setApprovalStatus(user.getApprovalStatus());
        userResponse.setEnabled(user.isEnabled());
        userResponse.setLocked(user.isLocked());
        userResponse.setCreatedAt(user.getCreatedAt());
        userResponse.setUpdatedAt(user.getUpdatedAt());

        AuthResponse authResponse = new AuthResponse(token, userResponse);
        objectMapper.findAndRegisterModules();
        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(authResponse));
    }
}
