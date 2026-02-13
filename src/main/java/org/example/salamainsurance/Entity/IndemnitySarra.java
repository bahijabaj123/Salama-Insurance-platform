package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "indemnities")
@Data
public class IndemnitySarra {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long idIndemnity;
    private Double grossAmount;
    private Integer responsibility;
    private Double deductibleValue;
    private Double netAmount;
private LocalDate calculationDate;
@Enumerated(EnumType.STRING)
    private SettlementStatus status;
    public IndemnitySarra() {
        this.calculationDate = LocalDate.now();
        this.status = SettlementStatus.PENDING;
    }
    public void setStatus(SettlementStatus status) {
        this.status = status;
    }
    public void setGrossAmount(Double grossAmount) { this.grossAmount = grossAmount; }
    public void setResponsibility(Integer responsibility) { this.responsibility = responsibility; }
    public void setDeductibleValue(Double deductibleValue) { this.deductibleValue = deductibleValue; }
    public void setNetAmount(Double netAmount) { this.netAmount = netAmount; }
}
