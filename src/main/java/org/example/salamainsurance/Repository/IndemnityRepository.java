package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.IndemnitySarra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IndemnityRepository extends JpaRepository<IndemnitySarra, Long> {
  Optional<IndemnitySarra> findByClaimId(Long claimId);
}
