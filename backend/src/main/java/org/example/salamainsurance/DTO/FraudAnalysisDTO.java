package org.example.salamainsurance.DTO;

import lombok.Data;
import org.example.salamainsurance.Entity.Fraud.RiskLevel;
import java.time.LocalDateTime;

@Data
public class FraudAnalysisDTO {
  private Long id;
  private Long claimId;
  private String claimReference;
  private LocalDateTime analysisDate;
  private int fraudScore;
  private RiskLevel riskLevel;
  private String triggeredRules;
  private String recommendation;
}
