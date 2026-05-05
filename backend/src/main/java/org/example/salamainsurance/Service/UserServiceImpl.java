package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.RegisterRequest;
import org.example.salamainsurance.DTO.UserCreateRequest;
import org.example.salamainsurance.DTO.UserResponse;
import org.example.salamainsurance.DTO.UserUpdateRequest;
import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.example.salamainsurance.Exception.BadRequestException;
import org.example.salamainsurance.Exception.DuplicateResourceException;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest req) {
        RoleName chosen = req.getRole();
        if (chosen == RoleName.ADMIN) {
            throw new BadRequestException("ADMIN role cannot be selected at registration");
        }
        if (chosen != RoleName.CLIENT && chosen != RoleName.ASSUREUR && chosen != RoleName.EXPERT) {
            throw new BadRequestException("Invalid registration role");
        }

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        User user;
        if (chosen == RoleName.CLIENT) {
            user = User.builder()
                    .email(req.getEmail())
                    .password(passwordEncoder.encode(req.getPassword()))
                    .fullName(req.getFullName())
                    .role(RoleName.CLIENT)
                    .requestedRole(null)
                    .approvalStatus(ApprovalStatus.APPROVED)
                    .enabled(false)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .build();
        } else {
            user = User.builder()
                    .email(req.getEmail())
                    .password(passwordEncoder.encode(req.getPassword()))
                    .fullName(req.getFullName())
                    .role(RoleName.CLIENT)
                    .requestedRole(chosen)
                    .approvalStatus(ApprovalStatus.PENDING)
                    .enabled(false)
                    .locked(false)
                    .failedLoginAttempts(0)
                    .build();
        }

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse create(UserCreateRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(req.getRole())
                .requestedRole(null)
                .approvalStatus(ApprovalStatus.APPROVED)
                .enabled(req.isEnabled())
                .locked(req.isLocked())
                .failedLoginAttempts(0)
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    @Override
    public UserResponse getByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UserUpdateRequest req, boolean isAdmin) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.getFullName() != null) {
            user.setFullName(req.getFullName());
        }
        if (isAdmin) {
            if (req.getRole() != null) {
                user.setRole(req.getRole());
            }
            if (req.getEnabled() != null) {
                user.setEnabled(req.getEnabled());
            }
            if (req.getLocked() != null) {
                user.setLocked(req.getLocked());
                if (!req.getLocked()) {
                    user.setFailedLoginAttempts(0);
                }
            }
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found");
        }
        userRepository.deleteById(id);
    }

    @Override
    public List<UserResponse> listPendingRoleRequests() {
        return userRepository.findByApprovalStatusAndRequestedRoleIsNotNull(ApprovalStatus.PENDING).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse approveRoleRequest(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getApprovalStatus() != ApprovalStatus.PENDING || user.getRequestedRole() == null) {
            throw new BadRequestException("No pending role request for this user");
        }
        user.setRole(user.getRequestedRole());
        user.setRequestedRole(null);
        user.setApprovalStatus(ApprovalStatus.APPROVED);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse rejectRoleRequest(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getApprovalStatus() != ApprovalStatus.PENDING || user.getRequestedRole() == null) {
            throw new BadRequestException("No pending role request for this user");
        }
        user.setRequestedRole(null);
        user.setApprovalStatus(ApprovalStatus.REJECTED);
        return mapToResponse(userRepository.save(user));
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        response.setRequestedRole(user.getRequestedRole());
        response.setApprovalStatus(user.getApprovalStatus());
        response.setEnabled(user.isEnabled());
        response.setLocked(user.isLocked());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
