package org.example.salamainsurance.Controller;

import org.example.salamainsurance.DTO.DeviceResponse;
import org.example.salamainsurance.DTO.UserResponse;
import org.example.salamainsurance.Service.DeviceService;
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
    private final DeviceService deviceService;

    public AdminUserController(UserService userService, DeviceService deviceService) {
        this.userService = userService;
        this.deviceService = deviceService;
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

    @GetMapping("/{id}/devices")
    public ResponseEntity<List<DeviceResponse>> getUserDevices(@PathVariable Long id) {
        return ResponseEntity.ok(deviceService.listDevicesForUserId(id));
    }
}
