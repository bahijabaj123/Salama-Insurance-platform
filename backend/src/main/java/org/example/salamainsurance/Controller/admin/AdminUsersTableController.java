package org.example.salamainsurance.Controller.admin;

import org.example.salamainsurance.DTO.admin.AdminUserRowDto;
import org.example.salamainsurance.DTO.admin.PageResponse;
import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Service.admin.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUsersTableController {

    private final AdminDashboardService adminDashboardService;

    public AdminUsersTableController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<AdminUserRowDto>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RoleName role,
            @RequestParam(required = false) RoleName requestedRole,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) Boolean locked
    ) {
        return ResponseEntity.ok(adminDashboardService.listUsers(
                page, size, sort, search, role, requestedRole, approvalStatus, enabled, locked
        ));
    }
}

