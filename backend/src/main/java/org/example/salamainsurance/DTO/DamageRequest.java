package org.example.salamainsurance.DTO;

public class DamageRequest {
  private String part;
  private String type;
  private String description;
  private Double cost;
  private String driver;


  // Getters et Setters
  public String getPart() { return part; }
  public void setPart(String part) { this.part = part; }

  public String getType() { return type; }
  public void setType(String type) { this.type = type; }

  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }

  public Double getCost() { return cost; }
  public void setCost(Double cost) { this.cost = cost; }

  public String getDriver() { return driver; }
  public void setDriver(String driver) { this.driver = driver; }
  }




