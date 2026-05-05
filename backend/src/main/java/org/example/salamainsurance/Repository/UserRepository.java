package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByApprovalStatusAndRequestedRoleIsNotNull(ApprovalStatus approvalStatus);
}
