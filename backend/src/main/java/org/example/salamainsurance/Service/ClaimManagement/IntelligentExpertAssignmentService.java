package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Exception.ResourceNotFoundException;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class IntelligentExpertAssignmentService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private ExpertAssignmentService expertAssignmentService;

  public ExpertAssignmentResult assignBestExpert(Long claimId) {
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new ResourceNotFoundException("Claim not found with id: " + claimId));

    ExpertHassen best = expertAssignmentService.findBestExpertForClaim(claim);
    if (best == null) {
      return ExpertAssignmentResult.builder()
        .assignedExpertId(null)
        .assignmentReason("Aucun expert disponible pour cette région, ou région non reconnue.")
        .build();
    }

    double score = expertAssignmentService.computeMatchScore(best, claim);
    return ExpertAssignmentResult.builder()
      .assignedExpertId(best.getIdExpert().longValue())
      .expertName(best.getFirstName() + " " + best.getLastName())
      .expertPhone(best.getPhone())
      .expertEmail(best.getEmail())
      .matchScore(score)
      .assignmentReason("Meilleure correspondance (région, charge, performance).")
      .build();
  }
}
