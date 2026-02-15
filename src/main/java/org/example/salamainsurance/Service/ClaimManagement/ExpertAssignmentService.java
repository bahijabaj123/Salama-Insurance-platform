package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.Expert;
import org.example.salamainsurance.Repository.ClaimManagement.ExpertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ExpertAssignmentService {

  @Autowired
  private ExpertRepository expertRepository;

  public Expert findBestExpertForClaim(Claim claim) {
    String region = claim.getRegion();

    // Get available experts in the region, sorted by best fit
    List<Expert> availableExperts = expertRepository.findBestExpertsForAssignment(region);

    if (availableExperts.isEmpty()) {
      return null;
    }

    // Score each expert based on multiple factors
    Expert bestExpert = null;
    double bestScore = -1;

    for (Expert expert : availableExperts) {
      double score = calculateExpertScore(expert, claim);
      if (score > bestScore) {
        bestScore = score;
        bestExpert = expert;
      }
    }

    return bestExpert;
  }

  private double calculateExpertScore(Expert expert, Claim claim) {
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
