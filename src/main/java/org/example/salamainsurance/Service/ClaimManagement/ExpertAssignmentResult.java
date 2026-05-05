package org.example.salamainsurance.Service.ClaimManagement;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExpertAssignmentResult {
  private Long assignedExpertId;
  private String expertName;
  private String expertPhone;
  private String expertEmail;
  private Double matchScore;
  private String assignmentReason;
  private List<ExpertScore> alternativeExperts;
  private LocalDateTime estimatedResponseTime;
}
