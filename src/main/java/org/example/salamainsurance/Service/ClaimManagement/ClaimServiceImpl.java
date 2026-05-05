package org.example.salamainsurance.Service.ClaimManagement;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;
import org.example.salamainsurance.Entity.ClaimManagement.Insurer;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.example.salamainsurance.Repository.ClaimManagement.InsurerRepository;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.example.salamainsurance.Service.DocumentService;
import org.example.salamainsurance.Service.Fraud.FraudDetectionService;
import org.example.salamainsurance.Service.Notification.EnhancedEmailService;
import org.example.salamainsurance.Service.Notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.example.salamainsurance.Entity.Document;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
@Slf4j
public class ClaimServiceImpl implements ClaimService {

  @Autowired
  private ClaimRepository claimRepository;

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
  private FraudDetectionService fraudDetectionService;

  @Autowired
  private IntelligentExpertAssignmentService intelligentAssignmentService;


  @Autowired
  private DocumentService documentService;

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

    accident.setClaim(savedClaim);
    accidentRepository.save(accident);

    notificationService.sendToInsurer(insurer, "New claim created: " + savedClaim.getReference());

    try {
      fraudDetectionService.analyzeClaimWithAlert(savedClaim.getId());
      log.info("✅ Analyse de fraude déclenchée pour le sinistre: {}", savedClaim.getReference());
    } catch (Exception e) {
      log.error("❌ Erreur lors de l'analyse de fraude: {}", e.getMessage());
    }

    return savedClaim;
  }

  @Override
  public Claim getClaimById(Long id) {
    return claimRepository.findByIdWithClient(id)
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

    if (claimDetails.getStatus() != null) {
      claim.setStatus(claimDetails.getStatus());
    }

    if (claimDetails.getNotes() != null) {
      claim.setNotes(claimDetails.getNotes());
    }

    if (claimDetails.getUrgencyScore() != null) {
      claim.setUrgencyScore(claimDetails.getUrgencyScore());
    }

    if (claimDetails.getRegion() != null && !claimDetails.getRegion().isEmpty()) {
      claim.setRegion(claimDetails.getRegion());
    }

    if (claimDetails.getExpert() != null) {
      claim.setExpert(claimDetails.getExpert());
    }

    if (claimDetails.getRegion() == null && claim.getAccident() != null) {
      claim.setRegion(claim.getAccident().getLocation());
    }

    claim.setLastModifiedDate(LocalDateTime.now());
    claim.addAction("Claim updated");
    return claimRepository.save(claim);
  }

  @Override
  @Transactional
  public void deleteClaim(Long id) {
    Claim claim = getClaimById(id);

    if (claim.getExpert() != null) {
      ExpertHassen expert = claim.getExpert();
      expert.setCurrentWorkload(Math.max(0, expert.getCurrentWorkload() - 1));
      expertRepository.save(expert);
      claim.setExpert(null);
    }

    if (claim.getActionHistory() != null) {
      claim.getActionHistory().clear();
    }

    if (claim.getExpertiseReports() != null) {
      claim.getExpertiseReports().clear();
    }

    claimRepository.save(claim);
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

    Set<ExpertStatus> assignableStatuses = Set.of(
      ExpertStatus.AVAILABLE,
      ExpertStatus.BUSY,
      ExpertStatus.ACTIVE
    );
    if (!assignableStatuses.contains(expert.getStatus())) {
      throw new IllegalStateException("Expert is not available. Status: " + expert.getStatus());
    }

    int currentWorkload = expert.getCurrentWorkload() != null ? expert.getCurrentWorkload() : 0;
    int maxWorkload = expert.getMaxWorkload() != null ? expert.getMaxWorkload() : 10;
    if (currentWorkload >= maxWorkload) {
      throw new IllegalStateException("Expert has reached maximum workload");
    }

    if (claim.getExpert() != null) {
      ExpertHassen previousExpert = claim.getExpert();
      int prevWorkload = previousExpert.getCurrentWorkload() != null ? previousExpert.getCurrentWorkload() : 0;
      previousExpert.setCurrentWorkload(Math.max(0, prevWorkload - 1));
      if (previousExpert.getCurrentWorkload() < previousExpert.getMaxWorkload()) {
        previousExpert.setStatus(ExpertStatus.AVAILABLE);
      }
      expertRepository.save(previousExpert);
    }

    claim.setExpert(expert);
    claim.setStatus(ClaimStatus.ASSIGNED_TO_EXPERT);
    claim.setAssignedDate(LocalDateTime.now());
    claim.addAction("Assigned to expert: " + expert.getFirstName() + " " + expert.getLastName());

    expert.setCurrentWorkload(currentWorkload + 1);
    expert.setLastAssignmentDate(LocalDateTime.now());

    if ((currentWorkload + 1) >= maxWorkload) {
      expert.setStatus(ExpertStatus.BUSY);
    }
    expertRepository.save(expert);
    Claim savedClaim = claimRepository.save(claim);

    try {
      enhancedEmailService.sendExpertAssignmentEmail(expert, claim);
      System.out.println("✅ Email d'assignation envoyé à: " + expert.getEmail());
    } catch (Exception e) {
      System.err.println("❌ Erreur envoi email: " + e.getMessage());
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
        claim.addAction("Auto-assignment failed: No expert available");
        return claimRepository.save(claim);
      }

      log.info("Expert {} assigné automatiquement au claim {} avec un score de {}",
        result.getAssignedExpertId(), claimId, result.getMatchScore());

      claim = getClaimById(claimId);
      claim.setNotes("Expert assigned automatically. Match score: " + result.getMatchScore() +
        ". Reason: " + result.getAssignmentReason());

      return claim;

    } catch (Exception e) {
      log.error("Erreur lors de l'auto-assignation pour le claim {}: {}", claimId, e.getMessage());
      claim.setNotes("Auto-assignment failed: " + e.getMessage());
      claim.addAction("Auto-assignment error");
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
    claim.addAction("Expert unassigned: " + expert.getFirstName() + " " + expert.getLastName());

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
    claim.addAction("Claim cancelled");

    return claimRepository.save(claim);
  }

  // ========== SEARCH OPERATIONS ==========

  @Override
  public List<Claim> searchClaims(String reference, ClaimStatus status, String region,
                                  Long expertId, LocalDateTime startDate, LocalDateTime endDate) {
    return claimRepository.searchClaims(reference, status, region, expertId != null ? expertId.intValue() : null, startDate, endDate);
  }

  @Override
  public List<Claim> findByStatus(ClaimStatus status) {
    return claimRepository.findByStatus(status);
  }

  @Override
  public List<Claim> findByExpertId(Integer expertId) {
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
      claim.addAction("Synced with accident update");
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

  @Override
  public List<Claim> findByClientId(Long clientId) {
    return List.of();
  }

  @Override
  public Claim uploadFinalInvoice(Long claimId, MultipartFile file) throws Exception {
    Claim claim = getClaimById(claimId);

    // Sauvegarder le document via DocumentService
// Sauvegarder le document via DocumentService
    Document document = documentService.saveDocument(claimId, file);
    // ✅ Utiliser un chemin absolu ou relatif au projet
    String projectDir = System.getProperty("user.dir");
    String uploadDir = projectDir + File.separator + "uploads" + File.separator + "invoices" + File.separator;

    // Créer le répertoire s'il n'existe pas
    File directory = new File(uploadDir);
    if (!directory.exists()) {
      boolean created = directory.mkdirs();
      if (!created) {
        throw new Exception("Impossible de créer le répertoire: " + uploadDir);
      }
    }

    // Générer un nom de fichier unique
    String fileName = "invoice_claim_" + claimId + "_" + System.currentTimeMillis() + ".pdf";
    String filePath = uploadDir + fileName;

    // Sauvegarder le fichier
    file.transferTo(new File(filePath));

    // Mettre à jour le statut du sinistre (fermer le sinistre)
    claim.setStatus(ClaimStatus.CLOSED);
    claim.setClosingDate(LocalDateTime.now());
    claim.setNotes(claim.getNotes() + "\n[Invoice uploaded: " + fileName + "]");
    claim.addAction("Final invoice uploaded - Claim closed");

    return claimRepository.save(claim);
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
