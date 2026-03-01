package org.example.salamainsurance.Repository.Fraud;

import org.example.salamainsurance.Entity.Fraud.FraudAnalysis;
import org.example.salamainsurance.Entity.Fraud.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FraudAnalysisRepository extends JpaRepository<FraudAnalysis, Long> {

  @Query("SELECT f FROM FraudAnalysis f WHERE f.claim.id = :claimId")
  FraudAnalysis findByClaimId(@Param("claimId") Long claimId);
  List<FraudAnalysis> findByRiskLevel(RiskLevel riskLevel);

  List<FraudAnalysis> findByAnalysisDateBetween(LocalDateTime start, LocalDateTime end);

  @Query("SELECT COUNT(f) FROM FraudAnalysis f WHERE f.riskLevel = :riskLevel")
  long countByRiskLevel(RiskLevel riskLevel);

  @Query("SELECT AVG(f.fraudScore) FROM FraudAnalysis f")
  Double averageFraudScore();

  List<FraudAnalysis> findTop5ByOrderByAnalysisDateDesc();
}
