package org.example.salamainsurance.Entity.Report;

import jakarta.persistence.*;

@Entity
@Table(name = "damages")
public class Damage {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String part;
  private String type;
  private String description;
  private Double cost;
  private String driver;

  @ManyToOne
  @JoinColumn(name = "accident_id")
  private Accident accident;

  public String getPart() {
    return part;
  }

  public void setPart(String part) {
    this.part = part;
  }

  public Accident getAccident() {
    return accident;
  }

  public void setAccident(Accident accident) {
    this.accident = accident;
  }

  public Double getCost() {
    return cost;
  }

  public void setCost(Double cost) {
    this.cost = cost;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getDriver() {
    return driver;
  }

  public void setDriver(String driver) {
    this.driver = driver;
  }
}
