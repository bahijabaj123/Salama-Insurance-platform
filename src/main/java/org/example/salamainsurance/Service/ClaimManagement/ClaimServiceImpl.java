package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Entity.ClaimManagement.Expert;
import org.example.salamainsurance.Entity.ClaimManagement.Insurer;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.ClaimManagement.ExpertRepository;
import org.example.salamainsurance.Repository.ClaimManagement.InsurerRepository;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class ClaimServiceImpl implements ClaimService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private AccidentRepository accidentRepository;

  @Autowired
  private ExpertRepository expertRepository;

  @Autowired
  private InsurerRepository insurerRepository;

  @Autowired
  private ExpertAssignmentService expertAssignmentService;

  @Autowired
  private NotificationService notificationService;

  // ========== BASIC CRUD OPERATIONS ==========

  @Override
  public Claim createClaimFromAccident(Long accidentId, Long insurerId) {
    // Find the accident
    Accident accident = accidentRepository.findById(accidentId)
      .orElseThrow(() -> new ResourceNotFoundException("Accident not found with id: " + accidentId));

    // Check if accident already has a claim
    if (claimRepository.findByAccidentId(accidentId) != null) {
      throw new IllegalStateException("Accident already has a claim associated");
    }

    // Handle insurer - if null or 0, find first available insurer
    Insurer insurer;

    if (insurerId == null || insurerId == 0) {
      // Trouver le premier assureur disponible
      insurer = insurerRepository.findFirstByOrderByIdAsc();

      // Si aucun assureur n'existe, en créer un par défaut
      if (insurer == null) {
        insurer = new Insurer();
        insurer.setEmail("system@salama.ma");
        insurer.setFirstName("System");
        insurer.setLastName("Default");
        insurer.setRole("SYSTEM");
        insurer = insurerRepository.save(insurer);
        System.out.println("✅ Default insurer created with ID: " + insurer.getId());
      }
    } else {
      insurer = (Insurer) insurerRepository.findById(insurerId)
        .orElseThrow(() -> new ResourceNotFoundException("Insurer not found with id: " + insurerId));
    }

    // Create new claim
    Claim claim = new Claim();
    claim.setAccident(accident);
    claim.setInsurer(insurer);
    claim.setStatus(ClaimStatus.OPENED);
    claim.setRegion(accident.getLocation());

    // Calculate urgency score (décommentez si la méthode existe)
    // claim.calculateUrgencyScore();

    // Save claim
    Claim savedClaim = claimRepository.save(claim);

    // Send notification
    if (notificationService != null) {
      notificationService.sendToInsurer(insurer, "New claim created: " + savedClaim.getReference());
    }
    // ✅ Étape 2: Maintenant mettre à jour l'accident avec le claim sauvegardé
    accident.setClaim(savedClaim);
    accidentRepository.save(accident);  // Maintenant ça marche car savedClaim a un ID
    return savedClaim;
  }

  @Override
  public Claim getClaimById(Long id) {
    return claimRepository.findById(id)
      .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));
  }

  @Override
  public Claim getClaimByReference(String reference) {
    Claim claim = claimRepository.findByReference(reference);
    if (claim == null) {
      throw new ResourceNotFoundException("Claim not found with reference: " + reference);
    }
    return claim;
  }

  @Override
  public List<Claim> getAllClaims() {
    return claimRepository.findAll();
  }

  @Override
  public Page<Claim> getAllClaimsPaginated(Pageable pageable) {
    return claimRepository.findAll(pageable);
  }

  @Override
  public Claim updateClaim(Long id, Claim claimDetails) {
    Claim claim = getClaimById(id);

    // Update allowed fields
    if (claimDetails.getStatus() != null) {
      claim.setStatus(claimDetails.getStatus());
    }

    if (claimDetails.getNotes() != null) {
      claim.setNotes(claimDetails.getNotes());
    }

    if (claimDetails.getExpert() != null) {
      claim.setExpert(claimDetails.getExpert());
    }

    // Sync with accident if needed
    if (claim.getAccident() != null) {
      // Accident might have been updated
      claim.setRegion(claim.getAccident().getLocation());
      // claim.calculateUrgencyScore();
    }

    claim.addAction("Claim updated by insurer");
    return claimRepository.save(claim);
  }

  @Override
  public void deleteClaim(Long id) {
    Claim claim = getClaimById(id);

    // Check if claim can be deleted
    if (claim.getStatus() == ClaimStatus.WAITING_FOR_INFORMATION) {
      throw new IllegalStateException("Cannot delete claim that is under expertise");
    }

    claim.addAction("Claim deleted");
    claimRepository.delete(claim);
  }

  @Override
  public void deleteClaimByReference(String reference) {
    Claim claim = getClaimByReference(reference);
    deleteClaim(claim.getId());
  }

  // ========== EXPERT ASSIGNMENT ==========

  @Override
  public Claim assignExpertToClaim(Long claimId, Long expertId) {
    Claim claim = getClaimById(claimId);
    Expert expert = expertRepository.findById(expertId)
      .orElseThrow(() -> new ResourceNotFoundException("Expert not found with id: " + expertId));

    // Check expert availability
    if (!expert.getAvailable()) {
      throw new IllegalStateException("Expert is not available");
    }

    // Check if claim already has an expert
    if (claim.getExpert() != null) {
      // Unassign previous expert
      Expert previousExpert = claim.getExpert();
      previousExpert.setActiveClaims(previousExpert.getActiveClaims() - 1);
      if (previousExpert.getActiveClaims() < 5) {
        previousExpert.setAvailable(true);
      }
      expertRepository.save(previousExpert);
    }

    // Assign new expert
    claim.setExpert(expert);
    claim.setStatus(ClaimStatus.WAITING_FOR_INFORMATION);
    claim.addAction("Assigned to expert: " + expert.getFirstName() + " " + expert.getLastName());

    // Update expert's active claims
    expert.setActiveClaims(expert.getActiveClaims() + 1);
    if (expert.getActiveClaims() >= 5) {
      expert.setAvailable(false);
    }
    expertRepository.save(expert);

    Claim savedClaim = claimRepository.save(claim);

    // Send notifications
    notificationService.sendToExpert(expert,
      "You have been assigned to claim: " + claim.getReference() +
        " in region: " + claim.getRegion());

    return savedClaim;
  }

  @Override
  public Claim autoAssignExpert(Long claimId) {
    Claim claim = getClaimById(claimId);

    if (claim.getExpert() != null) {
      throw new IllegalStateException("Claim already has an expert assigned");
    }

    // Get region from accident location
    String region = claim.getRegion();

    // Find best expert
    Expert bestExpert = expertAssignmentService.findBestExpertForClaim(claim);

    if (bestExpert == null) {
      claim.setNotes("No expert available for assignment in region: " + region);
      claim.addAction("Auto-assignment failed: No expert available");
      return claimRepository.save(claim);
    }

    return assignExpertToClaim(claimId, bestExpert.getId());
  }

  @Override
  public Claim unassignExpert(Long claimId) {
    Claim claim = getClaimById(claimId);

    if (claim.getExpert() == null) {
      throw new IllegalStateException("Claim has no expert assigned");
    }

    Expert expert = claim.getExpert();

    // Update expert
    expert.setActiveClaims(expert.getActiveClaims() - 1);
    if (expert.getActiveClaims() < 5) {
      expert.setAvailable(true);
    }
    expertRepository.save(expert);

    // Remove expert from claim
    claim.setExpert(null);
    claim.setStatus(ClaimStatus.OPENED);
    claim.addAction("Expert unassigned");

    return claimRepository.save(claim);
  }

  // ========== STATUS MANAGEMENT ==========

  @Override
  public Claim updateClaimStatus(Long claimId, ClaimStatus newStatus) {
    Claim claim = getClaimById(claimId);
    validateStatusTransition(claim.getStatus(), newStatus);

    claim.setStatus(newStatus);
    claim.addAction("Status changed to: " + newStatus);

    if (newStatus == ClaimStatus.CLOSED) {
      claim.setClosingDate(LocalDateTime.now());
      updateExpertPerformance(claim);
    }

    return claimRepository.save(claim);
  }

  @Override
  public Claim openClaim(Long claimId) {
    return updateClaimStatus(claimId, ClaimStatus.OPENED);
  }

  @Override
  public Claim closeClaim(Long claimId) {
    Claim claim = getClaimById(claimId);

    // Check if claim can be closed
    if (claim.getExpert() == null) {
      throw new IllegalStateException("Cannot close claim without expert assignment");
    }

    return updateClaimStatus(claimId, ClaimStatus.CLOSED);
  }

  @Override
  public Claim cancelClaim(Long claimId) {
    Claim claim = getClaimById(claimId);

    // Check if claim can be cancelled
    if (claim.getStatus() == ClaimStatus.CLOSED) {
      throw new IllegalStateException("Cannot cancel a closed claim");
    }

    // If expert was assigned, update expert's active claims
    if (claim.getExpert() != null) {
      Expert expert = claim.getExpert();
      expert.setActiveClaims(expert.getActiveClaims() - 1);
      if (expert.getActiveClaims() < 5) {
        expert.setAvailable(true);
      }
      expertRepository.save(expert);
    }

    claim.setStatus(ClaimStatus.CANCELLED);
    claim.addAction("Claim cancelled");

    return claimRepository.save(claim);
  }

  // ========== SEARCH OPERATIONS ==========

  @Override
  public List<Claim> searchClaims(String reference, ClaimStatus status, String region,
                                  Long expertId, LocalDateTime startDate, LocalDateTime endDate) {
    return claimRepository.searchClaims(reference, status, region, expertId, startDate, endDate);
  }

  @Override
  public List<Claim> findByStatus(ClaimStatus status) {
    return claimRepository.findByStatus(status);
  }

  @Override
  public List<Claim> findByExpertId(Long expertId) {
    return claimRepository.findByExpertId(expertId);
  }

  @Override
  public List<Claim> findByRegion(String region) {
    return claimRepository.findByRegionContaining(region);
  }

  @Override
  public List<Claim> findByDateRange(LocalDateTime start, LocalDateTime end) {
    return claimRepository.findByOpeningDateBetween(start, end);
  }

  // ========== STATISTICS & REPORTING ==========

  @Override
  public Map<String, Object> getClaimStatistics() {
    Map<String, Object> stats = new HashMap<>();

    // Count by status
    stats.put("total", claimRepository.count());
    stats.put("open", claimRepository.countByStatus(ClaimStatus.OPENED));
    stats.put("underExpertise", claimRepository.countByStatus(ClaimStatus.WAITING_FOR_INFORMATION));
    stats.put("reportSubmitted", claimRepository.countByStatus(ClaimStatus.EXPERT_REPORT_SUBMITTED));
    stats.put("closed", claimRepository.countByStatus(ClaimStatus.CLOSED));
    stats.put("cancelled", claimRepository.countByStatus(ClaimStatus.CANCELLED));

    // Average urgency for last 30 days
    LocalDateTime lastMonth = LocalDateTime.now().minusMonths(1);
    stats.put("averageUrgency", claimRepository.averageUrgencyScore(lastMonth));

    // By region
    stats.put("byRegion", getClaimsByRegion());

    // High urgency claims
    stats.put("highUrgencyCount", getHighUrgencyClaims().size());

    return stats;
  }

  @Override
  public Map<String, Object> getClaimsByStatus() {
    Map<String, Object> statusMap = new LinkedHashMap<>();
    statusMap.put("OPEN", claimRepository.countByStatus(ClaimStatus.OPENED));
    statusMap.put("UNDER_EXPERTISE", claimRepository.countByStatus(ClaimStatus.ASSIGNED_TO_EXPERT));
    statusMap.put("REPORT_SUBMITTED", claimRepository.countByStatus(ClaimStatus.EXPERT_REPORT_SUBMITTED));
    statusMap.put("CLOSED", claimRepository.countByStatus(ClaimStatus.CLOSED));
    statusMap.put("CANCELLED", claimRepository.countByStatus(ClaimStatus.CANCELLED));
    return statusMap;
  }

  @Override
  public Map<String, Object> getClaimsByRegion() {
    Map<String, Object> regionMap = new HashMap<>();
    List<Object[]> regionCounts = claimRepository.countByRegion();
    for (Object[] regionCount : regionCounts) {
      regionMap.put((String) regionCount[0], regionCount[1]);
    }
    return regionMap;
  }

  @Override
  public List<Claim> getHighUrgencyClaims() {
    return claimRepository.findAll().stream()
      .filter(c -> c.getUrgencyScore() != null && c.getUrgencyScore() > 70)
      .toList();
  }

  @Override
  public Long getTotalClaimsCount() {
    return claimRepository.count();
  }

  // ========== SYNC OPERATIONS ==========

  @Override
  public Claim syncWithAccident(Long claimId) {
    Claim claim = getClaimById(claimId);
    Accident accident = claim.getAccident();

    if (accident != null) {
      claim.setRegion(accident.getLocation());
      // claim.calculateUrgencyScore();
      claim.addAction("Synced with accident update");
    }

    return claimRepository.save(claim);
  }

  @Override
  public List<Claim> processNewValidAccidents() {
    // Cette méthode nécessite d'être implémentée selon vos besoins
    // Pour l'instant, retourne une liste vide
    return new ArrayList<>();
  }

  // ========== BATCH OPERATIONS ==========

  @Override
  public List<Claim> createClaimsBatch(List<Long> accidentIds, Long insurerId) {
    List<Claim> createdClaims = new ArrayList<>();
    for (Long accidentId : accidentIds) {
      try {
        Claim claim = createClaimFromAccident(accidentId, insurerId);
        createdClaims.add(claim);
      } catch (Exception e) {
        System.err.println("Failed to create claim for accident: " + accidentId + " - " + e.getMessage());
      }
    }
    return createdClaims;
  }

  @Override
  public void deleteClaimsBatch(List<Long> claimIds) {
    for (Long claimId : claimIds) {
      try {
        deleteClaim(claimId);
      } catch (Exception e) {
        System.err.println("Failed to delete claim: " + claimId + " - " + e.getMessage());
      }
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  private void validateStatusTransition(ClaimStatus current, ClaimStatus next) {
    if (current == ClaimStatus.CLOSED && next != ClaimStatus.CLOSED) {
      throw new IllegalStateException("Cannot reopen a closed claim");
    }

    if (current == ClaimStatus.CANCELLED) {
      throw new IllegalStateException("Cannot change status of a cancelled claim");
    }

    if (current == ClaimStatus.OPENED && next == ClaimStatus.EXPERT_REPORT_SUBMITTED) {
      throw new IllegalStateException("Cannot go from OPEN to REPORT_SUBMITTED directly. Must go through UNDER_EXPERTISE");
    }

    if (current == ClaimStatus.WAITING_FOR_INFORMATION && next == ClaimStatus.OPENED) {
      throw new IllegalStateException("Cannot go back to OPEN from UNDER_EXPERTISE");
    }
  }

  private void updateExpertPerformance(Claim claim) {
    if (claim.getExpert() == null) return;

    Expert expert = claim.getExpert();

    // Calculate processing time
    if (claim.getOpeningDate() != null && claim.getClosingDate() != null) {
      long hours = java.time.Duration.between(claim.getOpeningDate(), claim.getClosingDate()).toHours();

      // Update average processing time
      if (expert.getAverageProcessingTime() == null) {
        expert.setAverageProcessingTime((double) hours);
      } else {
        double newAvg = (expert.getAverageProcessingTime() + hours) / 2;
        expert.setAverageProcessingTime(newAvg);
      }
    }

    // Update active claims count
    expert.setActiveClaims(expert.getActiveClaims() - 1);
    if (expert.getActiveClaims() < 5) {
      expert.setAvailable(true);
    }

    expertRepository.save(expert);
  }
}
