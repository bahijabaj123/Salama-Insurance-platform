package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "indemnities")
@Data
public class IndemnitySarra {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)  // IDENTITY plus fiable que AUTO
  @Column(name = "id_indemnity")
  private Long idIndemnity;

  private Double grossAmount;
  private Integer responsibility;
  private Double deductibleValue;
  private Double netAmount;
  private LocalDate calculationDate;

  @Enumerated(EnumType.STRING)
  private SettlementStatus status;

  @Column(name = "claim_id")
  private Long claimId;


  public Long getId() {
    return idIndemnity;
  }

  @PrePersist
  protected void onCreate() {
    if (this.calculationDate == null) this.calculationDate = LocalDate.now();
    if (this.status == null) this.status = SettlementStatus.PENDING;
  }

  public void setStatus(SettlementStatus status) {
    this.status = status;
  }
  public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }
  public void setResponsibility(Integer responsibility) { this.responsibility = responsibility; }
  public void setDeductibleValue(Double deductibleValue) { this.deductibleValue = deductibleValue; }
  public void setNetAmount(Double netAmount) { this.netAmount = netAmount; }



}



