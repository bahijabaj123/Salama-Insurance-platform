package org.example.salamainsurance.Entity.Report;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "drivers")
public class Driver {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(name = "driver_type", length = 50)
  private DriverType driverType;

  private String name;
  private String cin;
  private String address;
  private String phoneNumber;
  private String licenseNumber;
  private String insuranceCompany;
  private String policyNumber;
  private String licensePlate;
  private String carMake;

  // ✅ NOUVEAU champ email
  private String email;

  @Column(columnDefinition = "LONGTEXT")
  private String signature;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @ManyToOne
  @JoinColumn(name = "accident_id")
  @JsonBackReference
  private Accident accident;

  @ElementCollection(targetClass = Circumstances.class)
  @CollectionTable(
    name = "driver_circumstances",
    joinColumns = @JoinColumn(name = "driver_id")
  )
  @Enumerated(EnumType.STRING)
  @Column(name = "circumstance")
  private List<Circumstances> circumstances;

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

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getSignature() {
    return signature;
  }

  public void setSignature(String signature) {
    this.signature = signature;
  }

  public LocalDate getDateOfBirth() {
    return dateOfBirth;
  }

  public void setDateOfBirth(LocalDate dateOfBirth) {
    this.dateOfBirth = dateOfBirth;
  }

  public Accident getAccident() {
    return accident;
  }

  public void setAccident(Accident accident) {
    this.accident = accident;
  }

  public List<Circumstances> getCircumstances() {
    return circumstances;
  }

  public void setCircumstances(List<Circumstances> circumstances) {
    this.circumstances = circumstances;
  }
}
