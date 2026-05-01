package org.example.salamainsurance.Service.ClaimManagement;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimHistory;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;
import org.example.salamainsurance.Entity.ClaimManagement.Insurer;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimHistoryRepository;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.example.salamainsurance.Repository.ClaimManagement.InsurerRepository;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.example.salamainsurance.Service.Notification.EnhancedEmailService;
import org.example.salamainsurance.Service.Notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
@Slf4j
public class ClaimServiceImpl implements ClaimService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private ClaimHistoryRepository claimHistoryRepository;

  @Autowired
  private AccidentRepository accidentRepository;

  @Autowired
  private ExpertHassenRepository expertRepository;

  @Autowired
  private InsurerRepository insurerRepository;

  @Autowired
  private ExpertAssignmentService expertAssignmentService;

  @Autowired
  private NotificationService notificationService;

  @Autowired
  private EnhancedEmailService enhancedEmailService;

  @Autowired
  private IntelligentExpertAssignmentService intelligentAssignmentService;

  // ========== BASIC CRUD OPERATIONS ==========

  @Override
  public Claim createClaimFromAccident(Long accidentId, Long insurerId) {
    Accident accident = accidentRepository.findById(accidentId)
      .orElseThrow(() -> new ResourceNotFoundException("Accident not found with id: " + accidentId));

    if (claimRepository.findByAccidentId(accidentId) != null) {
      throw new IllegalStateException("Accident already has a claim associated");
    }

    Insurer insurer;
    if (insurerId == null || insurerId == 0) {
      insurer = insurerRepository.findFirstByOrderByIdAsc();
      if (insurer == null) {
        insurer = new Insurer();
        insurer.setEmail("system@salama.ma");
        insurer.setFirstName("System");
        insurer.setLastName("Default");
        insurer.setRole("SYSTEM");
        insurer = insurerRepository.save(insurer);
      }
    } else {
      insurer = insurerRepository.findById(insurerId)
        .orElseThrow(() -> new ResourceNotFoundException("Insurer not found with id: " + insurerId));
    }

    Claim claim = new Claim();
    claim.setAccident(accident);
    claim.setInsurer(insurer);
    claim.setStatus(ClaimStatus.OPENED);
    claim.setRegion(accident.getLocation());

    Claim savedClaim = claimRepository.save(claim);

    // ⭐ Ajouter l'historique de création
    savedClaim.addHistory("CLAIM_CREATED", "Sinistre créé à partir de l'accident #" + accidentId, "SYSTEM");
    claimHistoryRepository.saveAll(savedClaim.getHistory());

    accident.setClaim(savedClaim);
    accidentRepository.save(accident);

    notificationService.sendToInsurer(insurer, "New claim created: " + savedClaim.getReference());

    return savedClaim;
  }

  @Override
  public Claim getClaimById(Long id) {
    Claim claim = claimRepository.findById(id)
      .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + id));

    // ⭐ Charger l'historique
    List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(id);
    claim.setHistory(history);

    return claim;
  }

  @Override
  public Claim getClaimByReference(String reference) {
    Claim claim = claimRepository.findByReference(reference);
    if (claim == null) {
      throw new ResourceNotFoundException("Claim not found with reference: " + reference);
    }

    // ⭐ Charger l'historique
    List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
    claim.setHistory(history);

    return claim;
  }

  @Override
  public List<Claim> getAllClaims() {
    List<Claim> claims = claimRepository.findAll();

    // ⭐ Charger l'historique pour chaque claim
    for (Claim claim : claims) {
      List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
      claim.setHistory(history);
    }

    return claims;
  }

  @Override
  public Page<Claim> getAllClaimsPaginated(Pageable pageable) {
    return claimRepository.findAll(pageable);
  }

  @Override
  public Claim updateClaim(Long id, Claim claimDetails) {
    Claim claim = getClaimById(id);

    String oldStatus = claim.getStatus().toString();

    if (claimDetails.getStatus() != null) {
      claim.setStatus(claimDetails.getStatus());
      // ⭐ Ajouter l'historique de changement de statut
      claim.addHistory("STATUS_UPDATED",
        "Statut changé de " + oldStatus + " à " + claimDetails.getStatus(),
        "INSUREUR");
      claimHistoryRepository.saveAll(claim.getHistory());
    }

    if (claimDetails.getNotes() != null) {
      claim.setNotes(claimDetails.getNotes());
      claim.addHistory("NOTES_UPDATED", "Notes mises à jour", "INSUREUR");
      claimHistoryRepository.saveAll(claim.getHistory());
    }

    if (claimDetails.getExpert() != null) {
      claim.setExpert(claimDetails.getExpert());
    }

    if (claim.getAccident() != null) {
      claim.setRegion(claim.getAccident().getLocation());
    }

    return claimRepository.save(claim);
  }

  @Override
  public void deleteClaim(Long id) {
    Claim claim = getClaimById(id);

    // ⭐ Ajouter l'historique avant suppression
    claim.addHistory("CLAIM_DELETED", "Sinistre supprimé", "SYSTEM");
    claimHistoryRepository.saveAll(claim.getHistory());

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
    ExpertHassen expert = expertRepository.findById(expertId.intValue())
      .orElseThrow(() -> new ResourceNotFoundException("Expert not found with id: " + expertId));

    // 1. Vérifier que l'expert est assignable
    Set<ExpertStatus> assignableStatuses = Set.of(
      ExpertStatus.AVAILABLE,
      ExpertStatus.BUSY,
      ExpertStatus.ACTIVE
    );
    if (!assignableStatuses.contains(expert.getStatus())) {
      throw new IllegalStateException("Expert is not available. Status: " + expert.getStatus());
    }

    // 2. Vérifier la charge de travail
    int currentWorkload = expert.getCurrentWorkload() != null ? expert.getCurrentWorkload() : 0;
    int maxWorkload = expert.getMaxWorkload() != null ? expert.getMaxWorkload() : 10;
    if (currentWorkload >= maxWorkload) {
      throw new IllegalStateException("Expert has reached maximum workload");
    }

    // 3. Désassigner l'ancien expert si nécessaire
    String previousExpertName = null;
    if (claim.getExpert() != null) {
      ExpertHassen previousExpert = claim.getExpert();
      previousExpertName = previousExpert.getFirstName() + " " + previousExpert.getLastName();
      int prevWorkload = previousExpert.getCurrentWorkload() != null ? previousExpert.getCurrentWorkload() : 0;
      previousExpert.setCurrentWorkload(Math.max(0, prevWorkload - 1));
      if (previousExpert.getCurrentWorkload() < previousExpert.getMaxWorkload()) {
        previousExpert.setStatus(ExpertStatus.AVAILABLE);
      }
      expertRepository.save(previousExpert);
    }

    // 4. Assigner le nouvel expert
    claim.setExpert(expert);
    claim.setStatus(ClaimStatus.ASSIGNED_TO_EXPERT);
    claim.setAssignedDate(LocalDateTime.now());

    // ⭐ Ajouter l'historique d'assignation
    String expertName = expert.getFirstName() + " " + expert.getLastName();
    if (previousExpertName != null) {
      claim.addHistory("EXPERT_REASSIGNED",
        "Expert changé de " + previousExpertName + " à " + expertName,
        "ASSIGNMENT_SYSTEM");
    } else {
      claim.addHistory("EXPERT_ASSIGNED",
        "Expert assigné: " + expertName,
        "ASSIGNMENT_SYSTEM");
    }
    claimHistoryRepository.saveAll(claim.getHistory());

    // 5. Mettre à jour la charge de l'expert
    expert.setCurrentWorkload(currentWorkload + 1);
    expert.setLastAssignmentDate(LocalDateTime.now());

    if ((currentWorkload + 1) >= maxWorkload) {
      expert.setStatus(ExpertStatus.BUSY);
    }
    expertRepository.save(expert);

    // 6. Sauvegarder le sinistre
    Claim savedClaim = claimRepository.save(claim);

    // 7. Envoyer l'email de notification
    try {
      enhancedEmailService.sendExpertAssignmentEmail(expert, claim);
      System.out.println("✅ Email d'assignation envoyé à: " + expert.getEmail());
    } catch (Exception e) {
      System.err.println("❌ Erreur envoi email: " + e.getMessage());
      e.printStackTrace();
    }

    return savedClaim;
  }

  @Override
  public Claim autoAssignExpert(Long claimId) {
    log.info("Demande d'auto-assignation intelligente pour le claim: {}", claimId);

    Claim claim = getClaimById(claimId);

    if (claim.getExpert() != null) {
      throw new IllegalStateException("Claim already has an expert assigned");
    }

    try {
      ExpertAssignmentResult result = intelligentAssignmentService.assignBestExpert(claimId);

      if (result.getAssignedExpertId() == null) {
        claim.setNotes("No expert available for assignment. " + result.getAssignmentReason());
        claim.addHistory("AUTO_ASSIGN_FAILED", "Auto-assignation échouée: Aucun expert disponible", "SYSTEM");
        claimHistoryRepository.saveAll(claim.getHistory());
        return claimRepository.save(claim);
      }

      log.info("Expert {} assigné automatiquement au claim {} avec un score de {}",
        result.getAssignedExpertId(), claimId, result.getMatchScore());

      claim = getClaimById(claimId);
      claim.setNotes("Expert assigned automatically. Match score: " + result.getMatchScore() +
        ". Reason: " + result.getAssignmentReason());

      claim.addHistory("AUTO_ASSIGN_SUCCESS",
        "Expert automatiquement assigné avec un score de " + result.getMatchScore() + "%",
        "SYSTEM");
      claimHistoryRepository.saveAll(claim.getHistory());

      return claim;

    } catch (Exception e) {
      log.error("Erreur lors de l'auto-assignation pour le claim {}: {}", claimId, e.getMessage());
      claim.setNotes("Auto-assignment failed: " + e.getMessage());
      claim.addHistory("AUTO_ASSIGN_ERROR", "Erreur lors de l'auto-assignation: " + e.getMessage(), "SYSTEM");
      claimHistoryRepository.saveAll(claim.getHistory());
      return claimRepository.save(claim);
    }
  }

  @Override
  public Claim unassignExpert(Long claimId) {
    Claim claim = getClaimById(claimId);

    if (claim.getExpert() == null) {
      throw new IllegalStateException("Claim has no expert assigned");
    }

    ExpertHassen expert = claim.getExpert();
    String expertName = expert.getFirstName() + " " + expert.getLastName();

    // Gérer les valeurs null
    int currentWorkload = expert.getCurrentWorkload() != null ? expert.getCurrentWorkload() : 0;
    int maxWorkload = expert.getMaxWorkload() != null ? expert.getMaxWorkload() : 10;

    expert.setCurrentWorkload(Math.max(0, currentWorkload - 1));

    if (expert.getCurrentWorkload() < maxWorkload) {
      expert.setStatus(ExpertStatus.AVAILABLE);
    }
    expertRepository.save(expert);

    claim.setExpert(null);
    claim.setStatus(ClaimStatus.OPENED);
    claim.setAssignedDate(null);

    // ⭐ Ajouter l'historique de désassignation
    claim.addHistory("EXPERT_UNASSIGNED", "Expert désassigné: " + expertName, "SYSTEM");
    claimHistoryRepository.saveAll(claim.getHistory());

    return claimRepository.save(claim);
  }

  // ========== STATUS MANAGEMENT ==========

  @Override
  public Claim updateClaimStatus(Long claimId, ClaimStatus newStatus) {
    Claim claim = getClaimById(claimId);
    ClaimStatus oldStatus = claim.getStatus();
    validateStatusTransition(oldStatus, newStatus);

    claim.setStatus(newStatus);

    // ⭐ Ajouter l'historique de changement de statut
    claim.addHistory("STATUS_UPDATED",
      "Statut changé de " + oldStatus + " à " + newStatus,
      "SYSTEM");
    claimHistoryRepository.saveAll(claim.getHistory());

    if (newStatus == ClaimStatus.CLOSED) {
      claim.setClosingDate(LocalDateTime.now());
      updateExpertPerformance(claim);
      claim.addHistory("CLAIM_CLOSED", "Sinistre clôturé", "SYSTEM");
      claimHistoryRepository.saveAll(claim.getHistory());
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
    if (claim.getExpert() == null) {
      throw new IllegalStateException("Cannot close claim without expert assignment");
    }
    return updateClaimStatus(claimId, ClaimStatus.CLOSED);
  }

  @Override
  public Claim cancelClaim(Long claimId) {
    Claim claim = getClaimById(claimId);

    if (claim.getStatus() == ClaimStatus.CLOSED) {
      throw new IllegalStateException("Cannot cancel a closed claim");
    }

    if (claim.getExpert() != null) {
      ExpertHassen expert = claim.getExpert();
      expert.setCurrentWorkload(Math.max(0, expert.getCurrentWorkload() - 1));
      if (expert.getCurrentWorkload() < expert.getMaxWorkload()) {
        expert.setStatus(ExpertStatus.AVAILABLE);
      }
      expertRepository.save(expert);
    }

    claim.setStatus(ClaimStatus.CANCELLED);

    // ⭐ Ajouter l'historique d'annulation
    claim.addHistory("CLAIM_CANCELLED", "Sinistre annulé", "SYSTEM");
    claimHistoryRepository.saveAll(claim.getHistory());

    return claimRepository.save(claim);
  }

  // ========== SEARCH OPERATIONS ==========

  @Override
  public List<Claim> searchClaims(String reference, ClaimStatus status, String region,
                                  Long expertId, LocalDateTime startDate, LocalDateTime endDate) {
    List<Claim> claims = claimRepository.searchClaims(reference, status, region, expertId != null ? expertId.intValue() : null, startDate, endDate);

    // ⭐ Charger l'historique pour chaque claim
    for (Claim claim : claims) {
      List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
      claim.setHistory(history);
    }

    return claims;
  }

  @Override
  public List<Claim> findByStatus(ClaimStatus status) {
    List<Claim> claims = claimRepository.findByStatus(status);
    for (Claim claim : claims) {
      List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
      claim.setHistory(history);
    }
    return claims;
  }

  @Override
  public List<Claim> findByExpertId(Integer expertId) {
    List<Claim> claims = claimRepository.findByExpertId(expertId);
    for (Claim claim : claims) {
      List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
      claim.setHistory(history);
    }
    return claims;
  }

  @Override
  public List<Claim> findByRegion(String region) {
    List<Claim> claims = claimRepository.findByRegionContaining(region);
    for (Claim claim : claims) {
      List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
      claim.setHistory(history);
    }
    return claims;
  }

  @Override
  public List<Claim> findByDateRange(LocalDateTime start, LocalDateTime end) {
    List<Claim> claims = claimRepository.findByOpeningDateBetween(start, end);
    for (Claim claim : claims) {
      List<ClaimHistory> history = claimHistoryRepository.findByClaimIdOrderByTimestampDesc(claim.getId());
      claim.setHistory(history);
    }
    return claims;
  }

  // ========== STATISTICS & REPORTING ==========

  @Override
  public Map<String, Object> getClaimStatistics() {
    Map<String, Object> stats = new HashMap<>();

    stats.put("total", claimRepository.count());
    stats.put("open", claimRepository.countByStatus(ClaimStatus.OPENED));
    stats.put("assigned", claimRepository.countByStatus(ClaimStatus.ASSIGNED_TO_EXPERT));
    stats.put("closed", claimRepository.countByStatus(ClaimStatus.CLOSED));
    stats.put("cancelled", claimRepository.countByStatus(ClaimStatus.CANCELLED));

    stats.put("byRegion", getClaimsByRegion());

    return stats;
  }

  @Override
  public Map<String, Object> getClaimsByStatus() {
    Map<String, Object> statusMap = new LinkedHashMap<>();
    statusMap.put("OPENED", claimRepository.countByStatus(ClaimStatus.OPENED));
    statusMap.put("ASSIGNED_TO_EXPERT", claimRepository.countByStatus(ClaimStatus.ASSIGNED_TO_EXPERT));
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
    return new ArrayList<>();
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
      claim.addHistory("SYNC_WITH_ACCIDENT", "Synchronisé avec l'accident", "SYSTEM");
      claimHistoryRepository.saveAll(claim.getHistory());
    }

    return claimRepository.save(claim);
  }

  @Override
  public List<Claim> processNewValidAccidents() {
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
        log.error("Failed to create claim for accident: {}", accidentId, e);
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
        log.error("Failed to delete claim: {}", claimId, e);
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
  }

  private void updateExpertPerformance(Claim claim) {
    if (claim.getExpert() == null) return;

    ExpertHassen expert = claim.getExpert();

    if (claim.getOpeningDate() != null && claim.getClosingDate() != null) {
      long hours = java.time.Duration.between(claim.getOpeningDate(), claim.getClosingDate()).toHours();

      if (expert.getAverageProcessingTime() == null) {
        expert.setAverageProcessingTime((double) hours);
      } else {
        double newAvg = (expert.getAverageProcessingTime() + hours) / 2;
        expert.setAverageProcessingTime(newAvg);
      }
    }

    expert.setCurrentWorkload(Math.max(0, expert.getCurrentWorkload() - 1));
    if (expert.getCurrentWorkload() < expert.getMaxWorkload()) {
      expert.setStatus(ExpertStatus.AVAILABLE);
    }

    expertRepository.save(expert);
  }
}
