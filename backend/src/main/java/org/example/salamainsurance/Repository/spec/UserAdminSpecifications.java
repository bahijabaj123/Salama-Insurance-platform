package org.example.salamainsurance.Repository.spec;

import org.example.salamainsurance.Entity.ApprovalStatus;
import org.example.salamainsurance.Entity.RoleName;
import org.example.salamainsurance.Entity.User;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public final class UserAdminSpecifications {

    private UserAdminSpecifications() {}

    public static Specification<User> adminFilters(
            String search,
            RoleName role,
            RoleName requestedRole,
            ApprovalStatus approvalStatus,
            Boolean enabled,
            Boolean locked
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String s = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), s),
                        cb.like(cb.lower(root.get("email")), s)
                ));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (requestedRole != null) {
                predicates.add(cb.equal(root.get("requestedRole"), requestedRole));
            }

            if (approvalStatus != null) {
                predicates.add(cb.equal(root.get("approvalStatus"), approvalStatus));
            }

            if (enabled != null) {
                predicates.add(cb.equal(root.get("enabled"), enabled));
            }

            if (locked != null) {
                predicates.add(cb.equal(root.get("locked"), locked));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

