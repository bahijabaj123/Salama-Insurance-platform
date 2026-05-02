package org.example.salamainsurance.Entity.ClaimManagement;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClaimHistory {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne
  @JoinColumn(name = "claim_id")
  private Claim claim;

  private String action; // "STATUS_UPDATED", "EXPERT_ASSIGNED", "CLAIM_CREATED", ...
  private String description; // Description lisible pour l'affichage
  private String performedBy;
  private LocalDateTime timestamp;

  // Constructeur utile
  public ClaimHistory(Claim claim, String action, String description, String performedBy) {
    this.claim = claim;
    this.action = action;
    this.description = description;
    this.performedBy = performedBy;
    this.timestamp = LocalDateTime.now();
  }
}
