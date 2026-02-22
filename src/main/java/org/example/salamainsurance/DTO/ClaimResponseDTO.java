package org.example.salamainsurance.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClaimResponseDTO {
  private Long id;
  private String reference;
  private String status;
  private String region;
  private LocalDateTime openingDate;
  private LocalDateTime assignedDate;
  private ExpertSummaryDTO expert;
  private String notes;

  @Data
  public static class ExpertSummaryDTO {
    private Long id;
    private String name;
    private String speciality;
  }
}
