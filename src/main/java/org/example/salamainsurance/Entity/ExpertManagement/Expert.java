package org.example.salamainsurance.Entity.ExpertManagement;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "experts")
public class Expert {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String email;

  private String firstName;
  private String lastName;
  private String phoneNumber;
  private String region; // Région de couverture
  private String speciality; // Spécialité (carrosserie, mécanique, vitrage, etc.)
  @ElementCollection
  private List<String> languages; // Langues parlées
  private Integer yearsOfExperience;

  private Boolean available = true;
  private Integer performanceScore = 100;
  private Integer activeClaims = 0;
  private Double averageProcessingTime; // in hours
  private Double validationRate; // percentage

  @Enumerated(EnumType.STRING)
  private ExpertStatus status; // AVAILABLE, BUSY, UNAVAILABLE
  private Integer currentWorkload; // Nombre de sinistres en cours
  private Integer maxWorkload; // Capacité maximale
  private LocalDateTime lastAssignmentDate;

  public String getSpeciality() {
    return speciality;
  }

  public void setSpeciality(String speciality) {
    this.speciality = speciality;
  }

  public LocalDateTime getLastAssignmentDate() {
    return lastAssignmentDate;
  }

  public void setLastAssignmentDate(LocalDateTime lastAssignmentDate) {
    this.lastAssignmentDate = lastAssignmentDate;
  }

  public Integer getMaxWorkload() {
    return maxWorkload;
  }

  public void setMaxWorkload(Integer maxWorkload) {
    this.maxWorkload = maxWorkload;
  }

  public Integer getCurrentWorkload() {
    return currentWorkload;
  }

  public void setCurrentWorkload(Integer currentWorkload) {
    this.currentWorkload = currentWorkload;
  }

  public ExpertStatus getStatus() {
    return status;
  }

  public void setStatus(ExpertStatus status) {
    this.status = status;
  }

  public Integer getYearsOfExperience() {
    return yearsOfExperience;
  }

  public void setYearsOfExperience(Integer yearsOfExperience) {
    this.yearsOfExperience = yearsOfExperience;
  }

  public List<String> getLanguages() {
    return languages;
  }

  public void setLanguages(List<String> languages) {
    this.languages = languages;
  }

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @OneToMany(mappedBy = "expert")
  @JsonIgnore
  private List<Claim> claims;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
  }

  // Getters and Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }

  public String getFirstName() { return firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }

  public String getLastName() { return lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }

  public String getPhoneNumber() { return phoneNumber; }
  public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

  public String getRegion() { return region; }
  public void setRegion(String region) { this.region = region; }

  public Boolean getAvailable() { return available; }
  public void setAvailable(Boolean available) { this.available = available; }

  public Integer getPerformanceScore() { return performanceScore; }
  public void setPerformanceScore(Integer performanceScore) { this.performanceScore = performanceScore; }

  public Integer getActiveClaims() { return activeClaims; }
  public void setActiveClaims(Integer activeClaims) { this.activeClaims = activeClaims; }

  public Double getAverageProcessingTime() { return averageProcessingTime; }
  public void setAverageProcessingTime(Double averageProcessingTime) { this.averageProcessingTime = averageProcessingTime; }

  public Double getValidationRate() { return validationRate; }
  public void setValidationRate(Double validationRate) { this.validationRate = validationRate; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public List<Claim> getClaims() { return claims; }
  public void setClaims(List<Claim> claims) { this.claims = claims; }
}
