package org.example.salamainsurance.Entity;

import jakarta.persistence.*;

import org.example.salamainsurance.Entity.RepairShopLinda;

import java.time.LocalDate;

@Entity
@Table(
        name = "garage_availability",
        uniqueConstraints = @UniqueConstraint(columnNames = {"garage_id", "date"})
)
public class GarageAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "garage_id", nullable = false)
    private Long garageId;

    // Relation lecture seule vers la table des garages (repair_shop_linda).
    // On garde `garageId` comme champ principal pour ne pas casser les queries existantes.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "garage_id", referencedColumnName = "id", insertable = false, updatable = false)
    private RepairShopLinda repairShopLinda;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private boolean available = true;

    public GarageAvailability() {
    }

    public GarageAvailability(Long garageId, LocalDate date, boolean available) {
        this.garageId = garageId;
        this.date = date;
        this.available = available;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getGarageId() {
        return garageId;
    }

    public void setGarageId(Long garageId) {
        this.garageId = garageId;
    }

    public RepairShopLinda getRepairShopLinda() {
        return repairShopLinda;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }
}

