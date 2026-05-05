package org.example.salamainsurance.Service;

import jakarta.servlet.http.HttpServletRequest;
import org.example.salamainsurance.DTO.DeviceResponse;
import org.example.salamainsurance.Entity.Device;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.DeviceRepository;
import org.example.salamainsurance.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeviceService {

    private static final Logger log = LoggerFactory.getLogger(DeviceService.class);
    private static final int MAX_USER_AGENT_LENGTH = 1024;

    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    public DeviceService(DeviceRepository deviceRepository, UserRepository userRepository) {
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
    }

    /**
     * Records or updates device info after a successful classic (password) login.
     * Never throws to callers: failures are logged only so login is never broken.
     */
    public void recordLoginForClassicAuth(String userEmail, HttpServletRequest request) {
        try {
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null) {
                return;
            }

            String normalizedUa = normalizeUserAgent(request.getHeader("User-Agent"));
            String ip = resolveClientIp(request);
            String deviceId = computeDeviceId(normalizedUa, ip);
            String storedUa = truncateUserAgent(normalizedUa);
            LocalDateTime now = LocalDateTime.now();

            deviceRepository.findByUser_IdAndDeviceId(user.getId(), deviceId).ifPresentOrElse(
                    existing -> {
                        existing.setLastLoginAt(now);
                        existing.setIpAddress(ip);
                        existing.setUserAgent(storedUa);
                        deviceRepository.save(existing);
                    },
                    () -> deviceRepository.save(Device.builder()
                            .user(user)
                            .deviceId(deviceId)
                            .userAgent(storedUa)
                            .ipAddress(ip)
                            .createdAt(now)
                            .lastLoginAt(now)
                            .build())
            );
        } catch (Exception e) {
            log.error("Failed to record device for user {}: {}", userEmail, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<DeviceResponse> listDevicesForUserEmail(String email) {
        return userRepository.findByEmail(email)
                .map(user -> deviceRepository.findByUser_IdOrderByLastLoginAtDesc(user.getId()).stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList()))
                .orElse(List.of());
    }

    private DeviceResponse toResponse(Device d) {
        DeviceResponse r = new DeviceResponse();
        r.setId(d.getId());
        r.setDeviceId(d.getDeviceId());
        r.setUserAgent(d.getUserAgent());
        r.setIpAddress(d.getIpAddress());
        r.setCreatedAt(d.getCreatedAt());
        r.setLastLoginAt(d.getLastLoginAt());
        return r;
    }

    static String normalizeUserAgent(String userAgent) {
        if (!StringUtils.hasText(userAgent)) {
            return "";
        }
        return userAgent.trim().replaceAll("\\s+", " ");
    }

    static String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xff)) {
            return xff.split(",")[0].trim();
        }
        String addr = request.getRemoteAddr();
        return StringUtils.hasText(addr) ? addr : "unknown";
    }

    static String computeDeviceId(String normalizedUserAgent, String ip) {
        String payload = normalizedUserAgent + "|" + ip;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String truncateUserAgent(String ua) {
        if (ua.length() <= MAX_USER_AGENT_LENGTH) {
            return ua;
        }
        return ua.substring(0, MAX_USER_AGENT_LENGTH);
    }
}
