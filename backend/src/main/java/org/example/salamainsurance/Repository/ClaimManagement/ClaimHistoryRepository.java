package org.example.salamainsurance.Repository.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.ClaimHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClaimHistoryRepository extends JpaRepository<ClaimHistory, Long> {
  List<ClaimHistory> findByClaimIdOrderByTimestampDesc(Long claimId);
}
