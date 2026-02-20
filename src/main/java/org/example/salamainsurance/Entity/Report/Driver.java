package org.example.salamainsurance.Entity.Report;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;

@Entity
@Table(name = "drivers")
public class Driver {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(name = "driver_type", length = 50)
  private DriverType driverType;

  private String name; // Nom
  private String cin;  // National ID / CIN
  private String address; // Adresse
  private String phoneNumber; // Telephone
  private String licenseNumber; // NumPermis
  private String insuranceCompany; // Assurance
  private String policyNumber; // NumContrat
  private String licensePlate; // Immatriculation
  private String carMake; // MarqueVoiture
  private String signature;

  @ManyToOne
  @JoinColumn(name = "accident_id")
  @JsonBackReference
  private Accident accident;

  // --- Getters & Setters ---

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public DriverType getDriverType() {
    return driverType;
  }

  public void setDriverType(DriverType driverType) {
    this.driverType = driverType;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getCin() {
    return cin;
  }

  public void setCin(String cin) {
    this.cin = cin;
  }

  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getPhoneNumber() {
    return phoneNumber;
  }

  public void setPhoneNumber(String phoneNumber) {
    this.phoneNumber = phoneNumber;
  }

  public String getLicenseNumber() {
    return licenseNumber;
  }

  public void setLicenseNumber(String licenseNumber) {
    this.licenseNumber = licenseNumber;
  }

  public String getInsuranceCompany() {
    return insuranceCompany;
  }

  public void setInsuranceCompany(String insuranceCompany) {
    this.insuranceCompany = insuranceCompany;
  }

  public String getPolicyNumber() {
    return policyNumber;
  }

  public void setPolicyNumber(String policyNumber) {
    this.policyNumber = policyNumber;
  }

  public String getLicensePlate() {
    return licensePlate;
  }

  public void setLicensePlate(String licensePlate) {
    this.licensePlate = licensePlate;
  }

  public String getCarMake() {
    return carMake;
  }

  public void setCarMake(String carMake) {
    this.carMake = carMake;
  }

  public String getSignature() {
    return signature;
  }

  public void setSignature(String signature) {
    this.signature = signature;
  }

  public Accident getAccident() {
    return accident;
  }

  public void setAccident(Accident accident) {
    this.accident = accident;
  }

  //ajout bahija
  public String getRegion() {
    return "";
  }
}
