package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sos_request")
public class SOSRequest {

  public enum SOSType {
    GARAGE,
    MECANICIEN,
    REMORQUAGE
  }

  public enum SOSStatus {
    EN_ATTENTE,
    EN_COURS,
    TERMINEE
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SOSType type;

  @Column(nullable = false)
  private String clientName;

  @Column(nullable = false)
  private String clientPhone;

  private Double latitude;
  private Double longitude;

  @Column(length = 1000)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SOSStatus status = SOSStatus.EN_ATTENTE;

  // Association garage (quand type = GARAGE)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "garage_id")
  private RepairShopLinda garage;

  // Association mécanicien (quand type = MECANICIEN)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "mechanic_id")
  private Mechanic mechanic;

  // Association remorqueur (quand type = REMORQUAGE)
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tow_truck_id")
  private TowTruck towTruck;

  private Instant createdAt = Instant.now();
  private Instant updatedAt = Instant.now();

  @PreUpdate
  public void preUpdate() {
    this.updatedAt = Instant.now();
  }

  // Getters & Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public SOSType getType() { return type; }
  public void setType(SOSType type) { this.type = type; }

  public String getClientName() { return clientName; }
  public void setClientName(String clientName) { this.clientName = clientName; }

  public String getClientPhone() { return clientPhone; }
  public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; }

  public Double getLatitude() { return latitude; }
  public void setLatitude(Double latitude) { this.latitude = latitude; }

  public Double getLongitude() { return longitude; }
  public void setLongitude(Double longitude) { this.longitude = longitude; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public SOSStatus getStatus() { return status; }
  public void setStatus(SOSStatus status) { this.status = status; }

  public RepairShopLinda getGarage() { return garage; }
  public void setGarage(RepairShopLinda garage) { this.garage = garage; }

  public Mechanic getMechanic() { return mechanic; }
  public void setMechanic(Mechanic mechanic) { this.mechanic = mechanic; }

  public TowTruck getTowTruck() { return towTruck; }
  public void setTowTruck(TowTruck towTruck) { this.towTruck = towTruck; }

  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
