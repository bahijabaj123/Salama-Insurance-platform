package org.example.salamainsurance.DTO;

import lombok.Data;
import java.util.List;

@Data
public class ExpertAssignmentRequest {
  private Long claimId;
  private String accidentRegion;
  private String damageType; // Type de dommage
  private Double estimatedAmount;
  private String priority; // HIGH, MEDIUM, LOW
  private Boolean requiresSpecialist;
}
