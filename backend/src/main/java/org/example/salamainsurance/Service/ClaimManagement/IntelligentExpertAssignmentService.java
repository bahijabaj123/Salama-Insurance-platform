package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

@Service
public class IntelligentExpertAssignmentService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private ExpertAssignmentService expertAssignmentService;

  @Autowired
  @Lazy
  private ClaimService claimService;

  public ExpertAssignmentResult assignBestExpert(Long claimId) {
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

    ExpertHassen best = expertAssignmentService.findBestExpertForClaim(claim);
    if (best == null) {
      return ExpertAssignmentResult.builder()
        .assignedExpertId(null)
        .assignmentReason("Aucun expert disponible pour la région du sinistre")
        .matchScore(0.0)
        .build();
    }

    Integer perf = best.getPerformanceScore();
    double score = perf != null ? perf.doubleValue() : 80.0;

    claimService.assignExpertToClaim(claimId, best.getIdExpert().longValue());

    String fullName = best.getFirstName() + " " + best.getLastName();
    return ExpertAssignmentResult.builder()
      .assignedExpertId(best.getIdExpert().longValue())
      .expertName(fullName)
      .expertPhone(best.getPhone())
      .expertEmail(best.getEmail())
      .matchScore(score)
      .assignmentReason("Meilleure correspondance zone, charge et performance")
      .build();
  }
}
