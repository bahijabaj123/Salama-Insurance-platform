package org.example.salamainsurance.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String PROVIDER_GITHUB = "github";
    private static final String GITHUB_FALLBACK_EMAIL_DOMAIN = "@github.local";

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${oauth2.success-redirect-url:http://localhost:4200/oauth2/success}")
    private String successRedirectUrl;

    public OAuth2AuthenticationSuccessHandler(UserRepository userRepository,
                                             JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String provider = resolveProvider(authentication);
        String email = resolveEmail(oAuth2User, provider);
        String name = resolveName(oAuth2User, provider);

        final String resolvedEmail = email;
        final String resolvedName = name;

        User user = userRepository.findByEmail(resolvedEmail)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(resolvedEmail)
                            .fullName(resolvedName != null ? resolvedName : resolvedEmail)
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

        clearAuthenticationAttributes(request);

        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String redirectUrl = successRedirectUrl + (successRedirectUrl.contains("?") ? "&" : "?") + "token=" + encodedToken;
        response.sendRedirect(redirectUrl);
    }

    /**
     * Detects the OAuth2 provider (e.g. "google", "github") from the
     * Spring Security registration id. Falls back to "google" so that any
     * unexpected token type keeps the previous behaviour.
     */
    private String resolveProvider(Authentication authentication) {
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            return oauthToken.getAuthorizedClientRegistrationId();
        }
        return "google";
    }

    /**
     * Email resolution per provider.
     * - Google: "email" attribute is always present (kept as-is).
     * - GitHub: "email" can be null when the user marks it private; fall back
     *   to "{login}@github.local" so we always have a stable identifier.
     */
    private String resolveEmail(OAuth2User oAuth2User, String provider) {
        String email = oAuth2User.getAttribute("email");
        if (email != null && !email.isBlank()) {
            return email;
        }

        if (PROVIDER_GITHUB.equalsIgnoreCase(provider)) {
            String login = oAuth2User.getAttribute("login");
            if (login != null && !login.isBlank()) {
                return login + GITHUB_FALLBACK_EMAIL_DOMAIN;
            }
        }

        return email;
    }

    /**
     * Display name resolution. GitHub's "name" can be null, in which case we
     * use "login" so the created user has a sensible full name.
     */
    private String resolveName(OAuth2User oAuth2User, String provider) {
        String name = oAuth2User.getAttribute("name");
        if (name != null && !name.isBlank()) {
            return name;
        }

        if (PROVIDER_GITHUB.equalsIgnoreCase(provider)) {
            String login = oAuth2User.getAttribute("login");
            if (login != null && !login.isBlank()) {
                return login;
            }
        }

        return name;
    }
}
