package org.example.salamainsurance.Repository.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.ExpertiseReport;
import org.example.salamainsurance.Entity.ClaimManagement.ExpertiseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpertiseReportRepository extends JpaRepository<ExpertiseReport, Long> {

  List<ExpertiseReport> findByClaimId(Long claimId);

  List<ExpertiseReport> findByExpertId(Long expertId);

  List<ExpertiseReport> findByStatus(ExpertiseStatus status);

  ExpertiseReport findByReference(String reference);
}
