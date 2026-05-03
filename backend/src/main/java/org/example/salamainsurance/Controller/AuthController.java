package org.example.salamainsurance.Controller;

import jakarta.validation.Valid;
import org.example.salamainsurance.DTO.AuthResponse;
import org.example.salamainsurance.DTO.LoginRequest;
import org.example.salamainsurance.DTO.RegisterRequest;
import org.example.salamainsurance.DTO.UserResponse;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.example.salamainsurance.Service.Notification.EmailService;
import org.example.salamainsurance.Service.DeviceService;
import org.example.salamainsurance.Service.LoginAttemptService;
import org.example.salamainsurance.Service.UserService;
import org.example.salamainsurance.Service.VerificationTokenService;
import org.example.salamainsurance.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final VerificationTokenService verificationTokenService;
    private final UserRepository userRepository;
    private final LoginAttemptService loginAttemptService;
    private final DeviceService deviceService;

    public AuthController(UserService userService,
                          AuthenticationManager authenticationManager,
                          JwtService jwtService,
                          EmailService emailService,
                          VerificationTokenService verificationTokenService,
                          UserRepository userRepository,
                          LoginAttemptService loginAttemptService,
                          DeviceService deviceService) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.verificationTokenService = verificationTokenService;
        this.userRepository = userRepository;
        this.loginAttemptService = loginAttemptService;
        this.deviceService = deviceService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse userResponse = userService.register(request);

        try {
            User user = userRepository.findByEmail(userResponse.getEmail()).orElseThrow();
            String rawToken = verificationTokenService.createTokenForUser(user);
            emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), rawToken);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", userResponse.getEmail(), e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful. Please check your email to verify your account."));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam String token) {
        verificationTokenService.verifyToken(token);
        return ResponseEntity.ok(Map.of("message", "Email verified. You can now login."));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            String email = authentication.getName();
            loginAttemptService.resetAttemptsOnSuccessfulLogin(email);
            deviceService.recordLoginForClassicAuth(email, httpRequest);
            UserResponse user = userService.getByEmail(email);
            String token = jwtService.generateToken(email);
            AuthResponse response = new AuthResponse(token, user);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            loginAttemptService.recordFailedPasswordAttempt(request.getEmail());
            throw e;
        }
    }
}
