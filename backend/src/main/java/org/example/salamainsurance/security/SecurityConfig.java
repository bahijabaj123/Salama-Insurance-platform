package org.example.salamainsurance.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint;
  private final JsonAccessDeniedHandler jsonAccessDeniedHandler;
  private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

  public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                        JsonAuthenticationEntryPoint jsonAuthenticationEntryPoint,
                        JsonAccessDeniedHandler jsonAccessDeniedHandler,
                        OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
    this.jwtAuthFilter = jwtAuthFilter;
    this.jsonAuthenticationEntryPoint = jsonAuthenticationEntryPoint;
    this.jsonAccessDeniedHandler = jsonAccessDeniedHandler;
    this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      // Désactive CSRF pour les tests API
      .csrf(csrf -> csrf.disable())

      // Configuration CORS
      .cors(cors -> cors.configurationSource(request -> {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("*")); // Autorise ton HTML local
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        return config;
      }))

      // OAuth2 code flow still needs a session for the authorization round-trip.
      // JWT for /api/** is carried per request via Authorization header (JwtAuthFilter).
      .sessionManagement(session ->
        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

      // /api/** must return JSON 401/403, never redirect to Google OAuth2
      .exceptionHandling(ex -> ex
        .defaultAuthenticationEntryPointFor(
            jsonAuthenticationEntryPoint,
            SecurityConfig::isUnderApiPath)
        .defaultAccessDeniedHandlerFor(
            jsonAccessDeniedHandler,
            SecurityConfig::isUnderApiPath))
      // Configuration des autorisations
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        // Public auth + OAuth2 first (order matters: first match wins)
        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
        .requestMatchers("/api/auth/**").permitAll()
        .requestMatchers("/api/complaints/test-ai").permitAll()
        .requestMatchers("/api/complaints/**").permitAll()
        .requestMatchers("/api/indemnities/**").permitAll()
        .requestMatchers("/api/repair-shops-linda/**").permitAll()
        .requestMatchers("/api/accidents/**").permitAll()
        .requestMatchers("/api/claims/**").permitAll()
        .requestMatchers("/error").permitAll()
        .requestMatchers("/api/complaints/**").permitAll()
        .requestMatchers("/api/reports/claim/*/pdf").permitAll()  // Pour un ID spécifique
// ou
        .requestMatchers("/api/reports/claim/**").permitAll()     // Pour tout ce qui suit
        .requestMatchers("/css/**", "/js/**", "/images/**", "/static/**").permitAll()

        .requestMatchers("/map-client-garages").permitAll()
        .requestMatchers("/api/complaints/**").permitAll()
        .requestMatchers("/map-client-garages").permitAll()
        .requestMatchers("/api/repair-shops-linda/**").permitAll()
        .requestMatchers("/api/complaints/**").permitAll()
        .requestMatchers("/api/garages/**").permitAll()
        .requestMatchers("/api/garages/nearest").permitAll()
        .requestMatchers("/api/garages/{garageId}/availability").permitAll()
        .requestMatchers("/api/garages/**").permitAll()
        .requestMatchers("/api/garages/nearest").permitAll()
        .requestMatchers("/api/garages/{garageId}/availability").permitAll()
        .requestMatchers("/api/dommages/**").permitAll()  // ← AJOUTEZ CETTE LIGNE

        .requestMatchers("/api/indemnities/**").permitAll()
        .requestMatchers("/api/repair-shops-linda/**").permitAll()
        .requestMatchers("/api/accidents/**").permitAll()
        .requestMatchers("/api/claims/**").permitAll()
        .requestMatchers("/error").permitAll()
        .requestMatchers("/api/accidents/**").permitAll()
        .requestMatchers("/api/expert-dashboard/**").permitAll()
        .requestMatchers("/api/experts/**").permitAll()
        .requestMatchers("/api/dommages/**").permitAll()
        .requestMatchers("/api/rapports/**").permitAll()







        // Endpoints publics (APIs de test)
        .requestMatchers("/api/indemnities/**").permitAll()
        .requestMatchers("/api/repair-shops-linda/**").permitAll()
        .requestMatchers("/api/accidents/**").permitAll()
        .requestMatchers("/api/claims/**").permitAll()
        .requestMatchers("/error").permitAll()
        .requestMatchers("/api/fraud/**").permitAll()
        .requestMatchers("/api/fraud/analyze/**").permitAll()
        .requestMatchers("/api/fraud/analyze-with-alert/**").permitAll()
        .requestMatchers("/api/fraud/dashboard").permitAll()
        .requestMatchers("/api/fraud/risk/**").permitAll()
        .requestMatchers("/api/fraud/alerts/config").permitAll()
        .requestMatchers("/api/fraud/analyses/**").permitAll()
        .requestMatchers("/api/fraud/test-simple/**").permitAll()

        // Endpoints publics (APIs de test)
        .requestMatchers("/api/test/patterns").permitAll()
        .requestMatchers("/api/chatbot/**").permitAll()
        .requestMatchers("/chatbot-test").permitAll()
        .requestMatchers("/chatbot/**").permitAll()
        .requestMatchers("/api/chatbot/**", "/chatbot-test", "/chatbot-test.html").permitAll()

        .requestMatchers("/api/rapports-expertise/**").permitAll()

        .requestMatchers("/api/main-oeuvre/**").permitAll()
        .requestMatchers("/api/rapports-expertise/**").permitAll()
        .requestMatchers("/api/experts/**").permitAll()
        .requestMatchers("/api/dommages/**").permitAll()
        .requestMatchers("/api/expert-dashboard/**").permitAll()
        .requestMatchers("/index.html", "/").permitAll()

        // Swagger UI
        .requestMatchers("/swagger-ui/**", "/api-docs/**", "/swagger-ui.html").permitAll()

        // All other /api/** routes require authentication (JWT via JwtAuthFilter)
        .requestMatchers("/api/**").authenticated()

        // Tout le reste nécessite une authentification
        .anyRequest().authenticated())

      // OAuth2 Login
      .oauth2Login(oauth2 -> oauth2
        .successHandler(oAuth2AuthenticationSuccessHandler))

      // JWT Filter
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);


    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  /**
   * Same scope as legacy {@code new AntPathRequestMatcher("/api/**")}: paths under {@code /api/}
   * plus the exact context-relative path {@code /api}.
   */
  private static boolean isUnderApiPath(HttpServletRequest request) {
    String path = request.getRequestURI();
    String contextPath = request.getContextPath();
    if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
      path = path.substring(contextPath.length());
    }
    if (!path.startsWith("/")) {
      path = "/" + path;
    }
    return "/api".equals(path) || path.startsWith("/api/");
  }
}
