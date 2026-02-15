package org.example.salamainsurance.Entity.ClaimManagement;

import org.example.salamainsurance.Entity.Report.Accident;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "claims")
public class Claim {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String reference;

  @Enumerated(EnumType.STRING)
  private ClaimStatus status = ClaimStatus.OPENED ;

  private LocalDateTime openingDate;
  private LocalDateTime closingDate;
  private LocalDateTime lastModifiedDate;

  // Scoring
  private Integer urgencyScore;
  private String severityLevel; // LOW, MEDIUM, HIGH, CRITICAL

  @OneToOne
  @JoinColumn(name = "accident_id", unique = true)
  private Accident accident;  // Le champ doit s'appeler "accident"

  // Expert assigned
  @ManyToOne
  @JoinColumn(name = "expert_id")
  private Expert expert;

  // Insurer who created/manages
  @ManyToOne
  @JoinColumn(name = "insurer_id")
  private Insurer insurer;

  // Expertise reports
  @OneToMany(mappedBy = "claim", cascade = CascadeType.ALL)
  private List<ExpertiseReport> expertiseReports = new ArrayList<>();

  // Region extracted from accident location
  private String region;

  @Column(length = 1000)
  private String notes;

  // Action history
  @ElementCollection
  @CollectionTable(name = "claim_actions", joinColumns = @JoinColumn(name = "claim_id"))  // Changez le nom
  private List<String> actionHistory = new ArrayList<>();

  @PrePersist
  protected void onCreate() {
    this.reference = generateReference();
    this.openingDate = LocalDateTime.now();
    this.lastModifiedDate = LocalDateTime.now();
    if (accident != null) {
      this.region = accident.getLocation();
    }
    calculateUrgencyScore();
    addAction("Claim created from accident");
  }

  @PreUpdate
  protected void onUpdate() {
    this.lastModifiedDate = LocalDateTime.now();
    if (accident != null) {
      this.region = accident.getLocation();
    }
    calculateUrgencyScore();
  }

  private String generateReference() {
    return "CLM-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")
      .format(LocalDateTime.now()) + "-" + System.currentTimeMillis() % 10000;
  }

  private void calculateUrgencyScore() {
    if (accident != null) {
      int score = 0;

      // Check if injuries (more urgent)
      if (accident.getInjuries() != null && accident.getInjuries()) {
        score += 30;
      }

      // Check property damage
      if (accident.getPropertyDamage() != null && accident.getPropertyDamage()) {
        score += 20;
      }

      // Photos count
      if (accident.getPhotos() != null) {
        score += accident.getPhotos().size() * 2;
      }

      // Recent accident
      if (accident.getAccidentDate() != null) {
        long daysSinceAccident = java.time.Duration.between(
          accident.getAccidentDate().atStartOfDay(),
          LocalDateTime.now()
        ).toDays();

        if (daysSinceAccident < 1) {
          score += 25; // Today
        } else if (daysSinceAccident < 3) {
          score += 15; // Within 3 days
        } else if (daysSinceAccident < 7) {
          score += 5;  // Within a week
        }
      }

      this.urgencyScore = Math.min(score, 100);

      // Determine severity level
      if (urgencyScore < 30) {
        this.severityLevel = "LOW";
      } else if (urgencyScore < 50) {
        this.severityLevel = "MEDIUM";
      } else if (urgencyScore < 70) {
        this.severityLevel = "HIGH";
      } else {
        this.severityLevel = "CRITICAL";
      }
    }
  }

  public void addAction(String action) {
    if (actionHistory == null) {
      actionHistory = new ArrayList<>();
    }
    actionHistory.add(LocalDateTime.now() + " - " + action);
  }

  /* Helper method to get driver's region from accident
  public String getDriverRegion() {
    if (accident != null && accident.getDrivers() != null) {
      // Assuming first driver's region is used
      return accident.getDrivers().getRegion();
    }
    return null;
  }*/

  // Getters and Setters
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public String getReference() { return reference; }
  public void setReference(String reference) { this.reference = reference; }

  public ClaimStatus getStatus() { return status; }
  public void setStatus(ClaimStatus status) {
    this.status = status;
    addAction("Status changed to: " + status);
  }

  public LocalDateTime getOpeningDate() { return openingDate; }
  public void setOpeningDate(LocalDateTime openingDate) { this.openingDate = openingDate; }

  public LocalDateTime getClosingDate() { return closingDate; }
  public void setClosingDate(LocalDateTime closingDate) { this.closingDate = closingDate; }

  public LocalDateTime getLastModifiedDate() { return lastModifiedDate; }
  public void setLastModifiedDate(LocalDateTime lastModifiedDate) { this.lastModifiedDate = lastModifiedDate; }

  public Integer getUrgencyScore() { return urgencyScore; }
  public void setUrgencyScore(Integer urgencyScore) { this.urgencyScore = urgencyScore; }

  public String getSeverityLevel() { return severityLevel; }
  public void setSeverityLevel(String severityLevel) { this.severityLevel = severityLevel; }

  public Accident getAccident() { return accident; }
  public void setAccident(Accident accident) {
    this.accident = accident;
    if (accident != null) {
      this.region = accident.getLocation();
    }
  }

  public Expert getExpert() { return expert; }
  public void setExpert(Expert expert) { this.expert = expert; }

  public Insurer getInsurer() { return insurer; }
  public void setInsurer(Insurer insurer) { this.insurer = insurer; }

  public List<ExpertiseReport> getExpertiseReports() { return expertiseReports; }
  public void setExpertiseReports(List<ExpertiseReport> expertiseReports) {
    this.expertiseReports = expertiseReports;
  }

  public String getRegion() { return region; }
  public void setRegion(String region) { this.region = region; }

  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }

  public List<String> getActionHistory() { return actionHistory; }
  public void setActionHistory(List<String> actionHistory) { this.actionHistory = actionHistory; }

  // Helper method to get latest expertise report
  public ExpertiseReport getLatestExpertiseReport() {
    if (expertiseReports == null || expertiseReports.isEmpty()) {
      return null;
    }
    return expertiseReports.get(expertiseReports.size() - 1);
  }
}
