package org.example.salamainsurance.Entity.ClaimManagement;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

import java.time.LocalDateTime;

@Entity
public class ClaimHistory {

  @Id
  @GeneratedValue
  private Long id;

  @ManyToOne
  private Claim claim;

  private String action; // "STATUS_UPDATED", "EXPERT_ASSIGNED", ...
  private String performedBy;
  private LocalDateTime timestamp;
}

