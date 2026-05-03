package org.example.salamainsurance.DTO;

import lombok.Builder;
import lombok.Data;
import org.example.salamainsurance.Service.ClaimManagement.ExpertScore;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExpertAssignmentResult {
  private Long assignedExpertId;
  private String expertName;
  private String expertPhone;
  private String expertEmail;
  private Double matchScore; // Score de correspondance (0-100)
  private String assignmentReason;
  private List<ExpertScore> alternativeExperts; // Autres experts avec leur score
  private LocalDateTime estimatedResponseTime;
}
