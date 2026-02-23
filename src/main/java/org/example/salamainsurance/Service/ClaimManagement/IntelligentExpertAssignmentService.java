package org.example.salamainsurance.Service.ClaimManagement;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Entity.ExpertManagement.Expert;
import org.example.salamainsurance.Entity.ExpertManagement.ExpertStatus;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.ExpertRepo.ExpertRepository;
import org.example.salamainsurance.Service.Notification.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntelligentExpertAssignmentService {

  private final ExpertRepository expertRepository;
  private final ClaimRepository claimRepository;
  private final NotificationService notificationService;

  // Poids pour chaque critère
  private static final double WEIGHT_REGION = 0.30;
  private static final double WEIGHT_AVAILABILITY = 0.25;
  private static final double WEIGHT_PERFORMANCE = 0.20;
  private static final double WEIGHT_SPECIALITY = 0.15;
  private static final double WEIGHT_WORKLOAD = 0.10;

  @Transactional
  public ExpertAssignmentResult assignBestExpert(Long claimId) {
    log.info("Début de l'attribution intelligente pour le sinistre ID: {}", claimId);

    // 1. Récupérer le sinistre
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new RuntimeException("Sinistre non trouvé"));

    // Vérifier si un expert est déjà assigné
    if (claim.getExpert() != null) {
      throw new IllegalStateException("Un expert est déjà assigné à ce sinistre");
    }

    // 2. Récupérer tous les experts disponibles
    List<Expert> availableExperts = expertRepository.findByStatus(ExpertStatus.AVAILABLE);

    if (availableExperts.isEmpty()) {
      log.warn("Aucun expert disponible pour le sinistre ID: {}", claimId);
      return handleNoExpertsAvailable(claim);
    }

    // 3. Extraire les informations du sinistre
    String claimRegion = extractRegionFromClaim(claim);
    String damageType = extractDamageTypeFromClaim(claim);

    // 4. Calculer le score pour chaque expert
    List<ExpertScore> expertScores = availableExperts.stream()
      .map(expert -> calculateExpertScore(expert, claimRegion, damageType))
      .sorted((e1, e2) -> Double.compare(e2.getScore(), e1.getScore()))
      .collect(Collectors.toList());

    // 5. Sélectionner le meilleur expert
    ExpertScore bestExpertScore = expertScores.get(0);
    Expert bestExpert = findExpertById(bestExpertScore.getExpertId());

    // 6. Assigner l'expert au sinistre
    assignExpertToClaim(claim, bestExpert);

    // 7. Envoyer les notifications
    notificationService.sendToExpert(bestExpert,
      "Vous avez été assigné au sinistre " + claim.getReference() +
        " dans la région " + claim.getRegion());

    // 8. Préparer le résultat
    return ExpertAssignmentResult.builder()
      .assignedExpertId(bestExpert.getId())
      .expertName(bestExpert.getFirstName() + " " + bestExpert.getLastName())
      .expertPhone(bestExpert.getPhoneNumber())
      .expertEmail(bestExpert.getEmail())
      .matchScore(bestExpertScore.getScore())
      .assignmentReason(generateAssignmentReason(bestExpertScore))
      .alternativeExperts(expertScores.stream().limit(3).collect(Collectors.toList()))
      .estimatedResponseTime(LocalDateTime.now().plusHours(2))
      .build();
  }

  private String extractDamageTypeFromClaim(Claim claim) {
    return null ;
  }

  private ExpertScore calculateExpertScore(Expert expert, String claimRegion, String damageType) {
    double score = 0.0;
    List<String> reasons = new ArrayList<>();

    // Critère 1: Région (30%)
    if (expert.getRegion() != null && expert.getRegion().equalsIgnoreCase(claimRegion)) {
      score += WEIGHT_REGION * 100;
      reasons.add("Expert dans la même région");
    } else {
      score += WEIGHT_REGION * 30;
      reasons.add("Expert en dehors de la région");
    }

    // Critère 2: Disponibilité (25%)
    double availabilityScore = calculateAvailabilityScore(expert);
    score += WEIGHT_AVAILABILITY * availabilityScore;
    if (availabilityScore > 80) {
      reasons.add("Très disponible");
    }

    // Critère 3: Performance (20%)
    if (expert.getPerformanceScore() != null) {
      score += WEIGHT_PERFORMANCE * expert.getPerformanceScore();
      reasons.add("Score performance: " + expert.getPerformanceScore());
    }

    // Critère 4: Spécialité (15%)
    if (expert.getSpeciality() != null && expert.getSpeciality().equalsIgnoreCase(damageType)) {
      score += WEIGHT_SPECIALITY * 100;
      reasons.add("Spécialiste du type de dommage");
    } else {
      score += WEIGHT_SPECIALITY * 50;
      reasons.add("Compétence générale");
    }

    // Critère 5: Charge de travail (10%)
    double workloadScore = calculateWorkloadScore(expert);
    score += WEIGHT_WORKLOAD * workloadScore;
    if (workloadScore > 80) {
      reasons.add("Charge de travail optimale");
    }

    return new ExpertScore(expert.getId(),
      expert.getFirstName() + " " + expert.getLastName(),
      Math.min(score, 100),
      reasons);
  }

  private double calculateAvailabilityScore(Expert expert) {
    if (expert.getCurrentWorkload() == null || expert.getMaxWorkload() == null) {
      return 70.0;
    }

    int workload = expert.getCurrentWorkload();
    int maxWorkload = expert.getMaxWorkload();

    if (workload >= maxWorkload) return 0.0;
    if (workload == 0) return 100.0;

    return ((double)(maxWorkload - workload) / maxWorkload) * 100;
  }

  private double calculateWorkloadScore(Expert expert) {
    if (expert.getCurrentWorkload() == null) return 70.0;

    int workload = expert.getCurrentWorkload();
    if (workload <= 1) return 60.0;
    if (workload == 2 || workload == 3) return 100.0;
    if (workload == 4) return 80.0;
    if (workload == 5) return 50.0;
    return 20.0;
  }

  private void assignExpertToClaim(Claim claim, Expert expert) {
    claim.setExpert(expert);
    claim.setStatus(ClaimStatus.ASSIGNED_TO_EXPERT);
    claim.setAssignedDate(LocalDateTime.now());
    claim.addAction("Expert assigné: " + expert.getFirstName() + " " + expert.getLastName());
    claimRepository.save(claim);

    expert.setCurrentWorkload(expert.getCurrentWorkload() == null ?
      1 : expert.getCurrentWorkload() + 1);
    expert.setLastAssignmentDate(LocalDateTime.now());

    if (expert.getCurrentWorkload() >= expert.getMaxWorkload()) {
      expert.setStatus(ExpertStatus.BUSY);
    }

    expertRepository.save(expert);

    log.info("Expert {} assigné au sinistre {}", expert.getId(), claim.getId());
  }

  private String extractRegionFromClaim(Claim claim) {
    if (claim.getAccident() != null && claim.getAccident().getLocation() != null) {
      return claim.getAccident().getLocation();
    }
    return claim.getRegion() != null ? claim.getRegion() : "DEFAULT";
  }

  /*private String extractDamageTypeFromClaim(Claim claim) {
    if (claim.getDamageType() != null) {
      return claim.getDamageType();
    }
    if (claim.getAccident() != null && claim.getAccident().getDamageDescription() != null) {
      String desc = claim.getAccident().getDamageDescription().toLowerCase();
      if (desc.contains("pare-chocs") || desc.contains("carrosserie")) return "CARROSSERIE";
      if (desc.contains("moteur") || desc.contains("mécanique")) return "MECANIQUE";
      if (desc.contains("vitre") || desc.contains("pare-brise")) return "VITRAGE";
    }
    return "GENERAL";
  }*/

  private Expert findExpertById(Long id) {
    return expertRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Expert non trouvé"));
  }

  private String generateAssignmentReason(ExpertScore score) {
    return String.format("Expert sélectionné avec un score de %.1f/100. Raisons: %s",
      score.getScore(),
      String.join(", ", score.getMatchReasons()));
  }

  private ExpertAssignmentResult handleNoExpertsAvailable(Claim claim) {
    claim.setNotes("Aucun expert disponible pour assignation");
    claim.addAction("Échec auto-assignation: aucun expert disponible");
    claimRepository.save(claim);

    notificationService.sendToInsurer(claim.getInsurer(),
      "Aucun expert disponible pour le sinistre " + claim.getReference());

    return ExpertAssignmentResult.builder()
      .assignedExpertId(null)
      .assignmentReason("Aucun expert disponible. Escalade au manager.")
      .estimatedResponseTime(LocalDateTime.now().plusHours(4))
      .build();
  }

  public List<Expert> findTopExpertsForClaim(Long claimId, int limit) {
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new RuntimeException("Claim not found"));

    String region = extractRegionFromClaim(claim);

    List<Expert> experts = expertRepository.findAvailableExpertsByRegion(region);

    return experts.stream()
      .map(expert -> {
        double score = calculateSimpleScore(expert, region);
        return new AbstractMap.SimpleEntry<>(expert, score);
      })
      .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
      .limit(limit)
      .map(Map.Entry::getKey)
      .collect(Collectors.toList());
  }

  private double calculateSimpleScore(Expert expert, String region) {
    double score = 0.0;

    if (expert.getRegion() != null && expert.getRegion().equals(region)) {
      score += 30;
    }

    if (expert.getPerformanceScore() != null) {
      score += expert.getPerformanceScore() * 0.4;
    }

    if (expert.getMaxWorkload() != null && expert.getCurrentWorkload() != null) {
      double availability = (expert.getMaxWorkload() - expert.getCurrentWorkload()) * 1.0 / expert.getMaxWorkload();
      score += availability * 30;
    }

    return score;
  }
}
