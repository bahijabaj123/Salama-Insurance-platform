package org.example.salamainsurance.Repository.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

  // Find by reference
  Claim findByReference(String reference);

  // Find by status
  List<Claim> findByStatus(ClaimStatus status);

  // Find by expert
  List<Claim> findByExpertId(Long expertId);

  // Find by region
  List<Claim> findByRegionContaining(String region);

  // Find by accident ID
  Claim findByAccidentId(Long accidentId);

  // Find by date range
  List<Claim> findByOpeningDateBetween(LocalDateTime start, LocalDateTime end);

  // Advanced search
  @Query("SELECT c FROM Claim c WHERE " +
    "(:reference IS NULL OR c.reference LIKE %:reference%) AND " +
    "(:status IS NULL OR c.status = :status) AND " +
    "(:region IS NULL OR c.region LIKE %:region%) AND " +
    "(:expertId IS NULL OR c.expert.id = :expertId) AND " +
    "(:startDate IS NULL OR c.openingDate >= :startDate) AND " +
    "(:endDate IS NULL OR c.openingDate <= :endDate)")
  List<Claim> searchClaims(
    @Param("reference") String reference,
    @Param("status") ClaimStatus status,
    @Param("region") String region,
    @Param("expertId") Long expertId,
    @Param("startDate") LocalDateTime startDate,
    @Param("endDate") LocalDateTime endDate);

  // Statistics
  @Query("SELECT COUNT(c) FROM Claim c WHERE c.status = :status")
  Long countByStatus(@Param("status") ClaimStatus status);

  @Query("SELECT AVG(c.urgencyScore) FROM Claim c WHERE c.openingDate >= :since")
  Double averageUrgencyScore(@Param("since") LocalDateTime since);

  @Query("SELECT c.region, COUNT(c) FROM Claim c GROUP BY c.region")
  List<Object[]> countByRegion();

  // Find claims with no expert assigned
  List<Claim> findByExpertIsNullAndStatus(ClaimStatus status);
}
