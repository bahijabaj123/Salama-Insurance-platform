package org.example.salamainsurance.Service.admin;

import org.example.salamainsurance.DTO.admin.AccountRatesDto;
import org.example.salamainsurance.DTO.admin.AdminUserRowDto;
import org.example.salamainsurance.DTO.admin.LabelCountDto;
import org.example.salamainsurance.DTO.admin.MonthlyUserCountDto;
import org.example.salamainsurance.DTO.admin.PageResponse;
import org.example.salamainsurance.DTO.admin.UserGrowthResponse;
import org.example.salamainsurance.DTO.admin.UserSummaryDto;
import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Repository.UserRepository;
import org.example.salamainsurance.Repository.spec.UserAdminSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private static final int MIN_GROWTH_MONTHS = 2;
    private static final int MAX_GROWTH_MONTHS = 24;
    private static final int DEFAULT_GROWTH_MONTHS = 6;

    private final UserRepository userRepository;

    public AdminDashboardServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserRowDto> listUsers(
            int page,
            int size,
            String sort,
            String search,
            RoleName role,
            RoleName requestedRole,
            ApprovalStatus approvalStatus,
            Boolean enabled,
            Boolean locked
    ) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                parseSort(sort)
        );

        Specification<User> spec = UserAdminSpecifications.adminFilters(
                search, role, requestedRole, approvalStatus, enabled, locked
        );

        Page<User> result = userRepository.findAll(spec, pageable);

        List<AdminUserRowDto> content = result.getContent().stream()
                .map(this::toRowDto)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto userSummary() {
        UserSummaryDto dto = new UserSummaryDto();

        dto.setTotalUsers(userRepository.count());
        dto.setTotalClients(userRepository.countByRole(RoleName.CLIENT));
        dto.setTotalAssureurs(userRepository.countByRole(RoleName.ASSUREUR));
        dto.setTotalExperts(userRepository.countByRole(RoleName.EXPERT));
        dto.setTotalAdmins(userRepository.countByRole(RoleName.ADMIN));

        dto.setPendingApprovals(userRepository.countByApprovalStatus(ApprovalStatus.PENDING));
        dto.setRejectedRequests(userRepository.countByApprovalStatus(ApprovalStatus.REJECTED));

        dto.setLockedUsers(userRepository.countByLockedTrue());
        dto.setEnabledUsers(userRepository.countByEnabledTrue());
        dto.setDisabledUsers(userRepository.countByEnabledFalse());

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelCountDto> usersByRole() {
        return userRepository.countUsersByRole().stream()
                .map(v -> new LabelCountDto(v.getLabel(), v.getCount()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LabelCountDto> usersByApprovalStatus() {
        return userRepository.countUsersByApprovalStatus().stream()
                .map(v -> new LabelCountDto(v.getLabel(), v.getCount()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserGrowthResponse usersGrowth(int months) {
        int window = clamp(months, MIN_GROWTH_MONTHS, MAX_GROWTH_MONTHS);

        YearMonth currentMonth = YearMonth.now();
        YearMonth startMonth = currentMonth.minusMonths(window - 1L);
        LocalDateTime startTimestamp = startMonth.atDay(1).atStartOfDay();

        // Pre-seed every bucket with 0 so months without registrations still appear.
        Map<YearMonth, Long> buckets = new LinkedHashMap<>();
        for (int i = 0; i < window; i++) {
            buckets.put(startMonth.plusMonths(i), 0L);
        }

        for (LocalDateTime createdAt : userRepository.findCreatedAtFrom(startTimestamp)) {
            YearMonth ym = YearMonth.from(createdAt);
            // Defensive: any timestamp that lands outside the requested window is ignored.
            if (buckets.containsKey(ym)) {
                buckets.merge(ym, 1L, Long::sum);
            }
        }

        List<MonthlyUserCountDto> series = new ArrayList<>(buckets.size());
        for (Map.Entry<YearMonth, Long> entry : buckets.entrySet()) {
            series.add(new MonthlyUserCountDto(entry.getKey().toString(), entry.getValue()));
        }

        YearMonth previousMonth = currentMonth.minusMonths(1);
        long currentCount = buckets.getOrDefault(currentMonth, 0L);
        long previousCount = buckets.getOrDefault(previousMonth, 0L);

        double currentVsPreviousPercent;
        double growthRate;
        if (previousCount == 0L) {
            // Division-by-zero rule: collapse undefined ratios to a defined business value.
            if (currentCount > 0L) {
                currentVsPreviousPercent = 100.0;
                growthRate = 100.0;
            } else {
                currentVsPreviousPercent = 0.0;
                growthRate = 0.0;
            }
        } else {
            currentVsPreviousPercent = (currentCount * 100.0) / previousCount;
            growthRate = ((currentCount - previousCount) * 100.0) / previousCount;
        }

        return new UserGrowthResponse(
                new MonthlyUserCountDto(currentMonth.toString(), currentCount),
                new MonthlyUserCountDto(previousMonth.toString(), previousCount),
                roundOneDecimal(currentVsPreviousPercent),
                roundOneDecimal(growthRate),
                series
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AccountRatesDto accountRates() {
        long total = userRepository.count();
        if (total == 0L) {
            return new AccountRatesDto(0.0, 0.0);
        }

        long enabled = userRepository.countByEnabledTrue();
        long rejected = userRepository.countByApprovalStatus(ApprovalStatus.REJECTED);

        double activationRate = (enabled * 100.0) / total;
        double rejectionRate = (rejected * 100.0) / total;

        return new AccountRatesDto(roundOneDecimal(activationRate), roundOneDecimal(rejectionRate));
    }

    /**
     * Clamps {@code value} to {@code [min, max]}. Used to defend the analytics
     * window against bad query-string input (negative, zero, or huge values).
     */
    static int clamp(int value, int min, int max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    private static double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    /**
     * Public so the controller can apply the same defaulting/clamping policy
     * before delegating to the service when the query param is missing.
     */
    public static int normalizeGrowthMonths(Integer months) {
        if (months == null) {
            return DEFAULT_GROWTH_MONTHS;
        }
        return clamp(months, MIN_GROWTH_MONTHS, MAX_GROWTH_MONTHS);
    }

    private AdminUserRowDto toRowDto(User u) {
        AdminUserRowDto dto = new AdminUserRowDto();
        dto.setId(u.getId());
        dto.setFullName(u.getFullName());
        dto.setEmail(u.getEmail());
        dto.setRole(u.getRole());
        dto.setRequestedRole(u.getRequestedRole());
        dto.setApprovalStatus(u.getApprovalStatus());
        dto.setEnabled(u.isEnabled());
        dto.setLocked(u.isLocked());
        dto.setCreatedAt(u.getCreatedAt());
        dto.setUpdatedAt(u.getUpdatedAt());
        return dto;
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String property = parts[0].trim();
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1) {
            direction = Sort.Direction.fromOptionalString(parts[1].trim()).orElse(Sort.Direction.DESC);
        }
        return Sort.by(direction, property);
    }
}

