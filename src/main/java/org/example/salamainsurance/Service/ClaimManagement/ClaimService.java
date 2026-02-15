package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ClaimService {

  // ========== BASIC CRUD OPERATIONS ==========
  Claim createClaimFromAccident(Long accidentId, Long insurerId);
  Claim getClaimById(Long id);
  Claim getClaimByReference(String reference);
  List<Claim> getAllClaims();
  Page<Claim> getAllClaimsPaginated(Pageable pageable);
  Claim updateClaim(Long id, Claim claimDetails);
  void deleteClaim(Long id);
  void deleteClaimByReference(String reference);

  // ========== EXPERT ASSIGNMENT ==========
  Claim assignExpertToClaim(Long claimId, Long expertId);
  Claim autoAssignExpert(Long claimId);
  Claim unassignExpert(Long claimId);

  // ========== STATUS MANAGEMENT ==========
  Claim updateClaimStatus(Long claimId, ClaimStatus newStatus);
  Claim openClaim(Long claimId);
  Claim closeClaim(Long claimId);
  Claim cancelClaim(Long claimId);

  // ========== SEARCH OPERATIONS ==========
  List<Claim> searchClaims(String reference, ClaimStatus status, String region,
                           Long expertId, LocalDateTime startDate, LocalDateTime endDate);

  List<Claim> findByStatus(ClaimStatus status);
  List<Claim> findByExpertId(Long expertId);
  List<Claim> findByRegion(String region);
  List<Claim> findByDateRange(LocalDateTime start, LocalDateTime end);

  // ========== STATISTICS & REPORTING ==========
  Map<String, Object> getClaimStatistics();
  Map<String, Object> getClaimsByStatus();
  Map<String, Object> getClaimsByRegion();
  List<Claim> getHighUrgencyClaims();
  Long getTotalClaimsCount();

  // ========== SYNC OPERATIONS ==========
  Claim syncWithAccident(Long claimId);
  List<Claim> processNewValidAccidents(); // Auto-create claims from valid accidents

  // ========== BATCH OPERATIONS ==========
  List<Claim> createClaimsBatch(List<Long> accidentIds, Long insurerId);
  void deleteClaimsBatch(List<Long> claimIds);
}
