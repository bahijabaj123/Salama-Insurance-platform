package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.UserCreateRequest;
import org.example.salamainsurance.DTO.UserResponse;
import org.example.salamainsurance.DTO.UserUpdateRequest;

import java.util.List;

public interface UserService {

    UserResponse create(UserCreateRequest req);

    List<UserResponse> getAll();

    UserResponse getById(Long id);

    UserResponse getByEmail(String email);

    UserResponse update(Long id, UserUpdateRequest req);

    void delete(Long id);
}
