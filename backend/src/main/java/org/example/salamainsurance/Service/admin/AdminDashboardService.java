package org.example.salamainsurance.Service.admin;

import org.example.salamainsurance.DTO.admin.AccountRatesDto;
import org.example.salamainsurance.DTO.admin.AdminUserRowDto;
import org.example.salamainsurance.DTO.admin.LabelCountDto;
import org.example.salamainsurance.DTO.admin.PageResponse;
import org.example.salamainsurance.DTO.admin.UserGrowthResponse;
import org.example.salamainsurance.DTO.admin.UserSummaryDto;
import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;

import java.util.List;

public interface AdminDashboardService {

    PageResponse<AdminUserRowDto> listUsers(
            int page,
            int size,
            String sort,
            String search,
            RoleName role,
            RoleName requestedRole,
            ApprovalStatus approvalStatus,
            Boolean enabled,
            Boolean locked
    );

    UserSummaryDto userSummary();

    List<LabelCountDto> usersByRole();

    List<LabelCountDto> usersByApprovalStatus();

    /**
     * Month-over-month user registration analytics over the last {@code months}
     * full months (inclusive of the current month). The {@code months} argument
     * is clamped to {@code [2, 24]}.
     */
    UserGrowthResponse usersGrowth(int months);

    /**
     * Activation and rejection rates over the total user base.
     */
    AccountRatesDto accountRates();
}

