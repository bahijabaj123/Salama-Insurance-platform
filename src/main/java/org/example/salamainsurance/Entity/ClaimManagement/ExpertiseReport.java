package org.example.salamainsurance.Entity.ClaimManagement;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "expertise_reports")
public class ExpertiseReport {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true)
  private String reference;

  @ManyToOne
  @JoinColumn(name = "claim_id", nullable = false)
  private Claim claim;

  @ManyToOne
  @JoinColumn(name = "expert_id", nullable = false)
  private Expert expert;

  private LocalDateTime expertiseDate;

  @Column(length = 2000)
  private String findings; // Conclusions de l'expert

  private Double estimatedRepairCost;
  private Double estimatedIndemnity;

  // Nouvelles photos prises par l'expert
  @ElementCollection
  @CollectionTable(name = "expertise_photos", joinColumns = @JoinColumn(name = "expertise_id"))
  @Column(name = "photo_url")
  private List<String> expertPhotos = new ArrayList<>();

  private Boolean isValidated = false;
  private String validationComments;

  // Décision de l'expert
  private Boolean claimValid; // Sinistre valide ou non ?
  private String rejectionReason; // Si rejeté

  @Enumerated(EnumType.STRING)
  private ExpertiseStatus status = ExpertiseStatus.DRAFT;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "submitted_at")
  private LocalDateTime submittedAt;

  @PrePersist
  protected void onCreate() {
    this.reference = "EXP-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
      .format(LocalDateTime.now());
    this.createdAt = LocalDateTime.now();
    this.expertiseDate = LocalDateTime.now();
  }

  // Getters and Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getReference() { return reference; }
  public void setReference(String reference) { this.reference = reference; }

  public Claim getClaim() { return claim; }
  public void setClaim(Claim claim) { this.claim = claim; }

  public Expert getExpert() { return expert; }
  public void setExpert(Expert expert) { this.expert = expert; }

  public LocalDateTime getExpertiseDate() { return expertiseDate; }
  public void setExpertiseDate(LocalDateTime expertiseDate) { this.expertiseDate = expertiseDate; }

  public String getFindings() { return findings; }
  public void setFindings(String findings) { this.findings = findings; }

  public Double getEstimatedRepairCost() { return estimatedRepairCost; }
  public void setEstimatedRepairCost(Double estimatedRepairCost) { this.estimatedRepairCost = estimatedRepairCost; }

  public Double getEstimatedIndemnity() { return estimatedIndemnity; }
  public void setEstimatedIndemnity(Double estimatedIndemnity) { this.estimatedIndemnity = estimatedIndemnity; }

  public List<String> getExpertPhotos() { return expertPhotos; }
  public void setExpertPhotos(List<String> expertPhotos) { this.expertPhotos = expertPhotos; }

  public Boolean getIsValidated() { return isValidated; }
  public void setIsValidated(Boolean isValidated) { this.isValidated = isValidated; }

  public String getValidationComments() { return validationComments; }
  public void setValidationComments(String validationComments) { this.validationComments = validationComments; }

  public Boolean getClaimValid() { return claimValid; }
  public void setClaimValid(Boolean claimValid) { this.claimValid = claimValid; }

  public String getRejectionReason() { return rejectionReason; }
  public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

  public ExpertiseStatus getStatus() { return status; }
  public void setStatus(ExpertiseStatus status) { this.status = status; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public LocalDateTime getSubmittedAt() { return submittedAt; }
  public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
