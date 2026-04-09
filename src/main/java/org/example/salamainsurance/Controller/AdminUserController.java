package org.example.salamainsurance.Controller;

import org.example.salamainsurance.DTO.UserResponse;
import org.example.salamainsurance.Service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/pending-role-requests")
    public ResponseEntity<List<UserResponse>> pendingRoleRequests() {
        return ResponseEntity.ok(userService.listPendingRoleRequests());
    }

    @PostMapping("/{id}/approve-role")
    public ResponseEntity<UserResponse> approveRole(@PathVariable Long id) {
        return ResponseEntity.ok(userService.approveRoleRequest(id));
    }

    @PostMapping("/{id}/reject-role")
    public ResponseEntity<UserResponse> rejectRole(@PathVariable Long id) {
        return ResponseEntity.ok(userService.rejectRoleRequest(id));
    }
}
