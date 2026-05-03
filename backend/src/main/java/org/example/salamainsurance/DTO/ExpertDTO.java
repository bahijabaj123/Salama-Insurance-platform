package org.example.salamainsurance.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ExpertDTO {
  private Integer id;
  private String firstName;
  private String lastName;
  private String email;
  private String phone;
  private String interventionZone;
  private String speciality;
  private String status;
  private Integer performanceScore;
  private Integer currentWorkload;
  private Integer maxWorkload;
  private Double averageProcessingTime;
  private Integer yearsOfExperience;
  private LocalDateTime lastAssignmentDate;
}
