package org.example.salamainsurance.Entity.Fraud;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;

import java.time.LocalDateTime;

@Entity
@Table(name = "fraud_analyses")
@Data
@NoArgsConstructor
public class FraudAnalysis {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  //  Relation directe avec Claim
  @ManyToOne
  @JoinColumn(name = "claim_id", nullable = false, unique = true)
  private Claim claim;


  @Column(name = "claim_reference")
  private String claimReference;

  @Column(name = "analysis_date")
  private LocalDateTime analysisDate;

  @Column(name = "fraud_score")
  private int fraudScore;

  @Enumerated(EnumType.STRING)
  @Column(name = "risk_level")
  private RiskLevel riskLevel;

  @Column(name = "triggered_rules", length = 2000)
  private String triggeredRules; // Stocké en JSON ou texte

  @Column(name = "recommendation", length = 500)
  private String recommendation;

  @Column(name = "analyzed_by")
  private String analyzedBy; // "SYSTEM" ou "MANUAL"

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getAnalyzedBy() {
    return analyzedBy;
  }

  public void setAnalyzedBy(String analyzedBy) {
    this.analyzedBy = analyzedBy;
  }

  public String getRecommendation() {
    return recommendation;
  }

  public void setRecommendation(String recommendation) {
    this.recommendation = recommendation;
  }

  public String getTriggeredRules() {
    return triggeredRules;
  }

  public void setTriggeredRules(String triggeredRules) {
    this.triggeredRules = triggeredRules;
  }

  public RiskLevel getRiskLevel() {
    return riskLevel;
  }

  public void setRiskLevel(RiskLevel riskLevel) {
    this.riskLevel = riskLevel;
  }

  public int getFraudScore() {
    return fraudScore;
  }

  public void setFraudScore(int fraudScore) {
    this.fraudScore = fraudScore;
  }

  public LocalDateTime getAnalysisDate() {
    return analysisDate;
  }

  public void setAnalysisDate(LocalDateTime analysisDate) {
    this.analysisDate = analysisDate;
  }

  public String getClaimReference() {
    return claimReference;
  }

  public void setClaimReference(String claimReference) {
    this.claimReference = claimReference;
  }

  public Claim getClaim() {
    return claim;
  }

  public void setClaim(Claim claim) {
    this.claim = claim;
  }

  @PrePersist
  protected void onCreate() {
    analysisDate = LocalDateTime.now();
    if (claim != null) {
      this.claimReference = claim.getReference(); // Copie auto
    }
  }

  public void setClaimId(Long id) {
  }
}
