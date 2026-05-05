package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;        // ← CORRIGÉ
import org.example.salamainsurance.Entity.Expert.ExpertStatus;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ExpertAssignmentService {

  @Autowired
  private ExpertHassenRepository expertRepository;

  public ExpertHassen findBestExpertForClaim(Claim claim) {
    String region = claim.getRegion();

    // Convertir la String region en InterventionZone
    ExpertHassen.InterventionZone zone = null;
    try {
      // Convertir "Tunis" → "TUNIS", "Ben Arous" → "BEN_AROUS"
      String zoneName = region.toUpperCase().replace(" ", "_");
      zone = ExpertHassen.InterventionZone.valueOf(zoneName);
    } catch (IllegalArgumentException e) {
      // Si la région n'existe pas dans l'enum, retourner null
      return null;
    }

    // Get available experts in the region, sorted by best fit
    List<ExpertHassen> availableExperts = expertRepository.findBestExpertsForAssignment(zone);

    if (availableExperts.isEmpty()) {
      return null;
    }


    // Score each expert based on multiple factors
    ExpertHassen bestExpert = null;
    double bestScore = -1;

    for (ExpertHassen expert : availableExperts) {
      double score = calculateExpertScore(expert, claim);
      if (score > bestScore) {
        bestScore = score;
        bestExpert = expert;
      }
    }

    return bestExpert;
  }

  private double calculateExpertScore(ExpertHassen expert, Claim claim) {
    double score = 0;

    // Performance score (40% weight)
    if (expert.getPerformanceScore() != null) {
      score += expert.getPerformanceScore() * 0.4;
    } else {
      score += 80 * 0.4; // Default score if not set
    }

    // Active claims (30% weight) - fewer is better
    int activeClaims = expert.getActiveClaims() != null ? expert.getActiveClaims() : 0;
    double activeClaimsScore = Math.max(0, 100 - (activeClaims * 10));
    score += activeClaimsScore * 0.3;

    // Processing time (30% weight) - faster is better for urgent claims
    if (expert.getAverageProcessingTime() != null) {
      double speedScore = Math.max(0, 100 - expert.getAverageProcessingTime());
      // Apply urgency factor
      if (claim.getUrgencyScore() != null && claim.getUrgencyScore() > 50) {
        speedScore *= 1.2; // Boost for urgent claims
      }
      score += Math.min(speedScore, 100) * 0.3;
    } else {
      score += 70 * 0.3; // Default speed score
    }

    return score;
  }
}


