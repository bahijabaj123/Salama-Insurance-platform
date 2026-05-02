package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.repository.query.Param;
import org.example.salamainsurance.Entity.RoleName;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByApprovalStatusAndRequestedRoleIsNotNull(ApprovalStatus approvalStatus);

    long countByRole(RoleName role);

    long countByApprovalStatus(ApprovalStatus approvalStatus);

    long countByLockedTrue();

    long countByEnabledTrue();

    long countByEnabledFalse();

    interface LabelCountView {
        String getLabel();
        long getCount();
    }

    @Query("select u.role as label, count(u) as count from User u group by u.role")
    List<LabelCountView> countUsersByRole();

    @Query("select u.approvalStatus as label, count(u) as count from User u group by u.approvalStatus")
    List<LabelCountView> countUsersByApprovalStatus();

    /**
     * Returns the {@code createdAt} timestamp of every user created on or after
     * {@code start}. Used by the admin user-growth analytics to bucket users by
     * month in the service layer (DB-agnostic, no native date functions needed).
     */
    @Query("select u.createdAt from User u where u.createdAt is not null and u.createdAt >= :start")
    List<LocalDateTime> findCreatedAtFrom(@Param("start") LocalDateTime start);
}
