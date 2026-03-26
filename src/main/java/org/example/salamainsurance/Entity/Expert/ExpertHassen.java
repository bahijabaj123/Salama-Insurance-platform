package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "expert")
public class ExpertHassen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_expert")
    private Integer idExpert;

    @Column(name = "last_name", length = 100, nullable = false)
    @NotBlank(message = "Last name is mandatory")
    private String lastName;

    @Column(name = "first_name", length = 100, nullable = false)
    @NotBlank(message = "First name is mandatory")
    private String firstName;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "email", length = 150, nullable = false, unique = true)
    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "fax", length = 20)
    private String fax;

    @Column(name = "specialty", length = 100)
    private String specialty;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10)
    private ExpertStatus status;  // ← utilise l'enum fusionné


    @Enumerated(EnumType.STRING)
    @Column(name = "intervention_zone", length = 20)
    private InterventionZone interventionZone;
// ← region devient intervention_zone

    @Column(name = "registration_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate registrationDate;

    @Column(name = "years_of_experience")
    @Min(value = 0, message = "Years of experience must be positive")
    private Integer yearsOfExperience;

    // Relation one expert -> many expert reports
    @OneToMany(mappedBy = "expert", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ExpertReportHassen> expertReports;

    // ===== ENUMS =====
    public enum InterventionZone {
        Tunis, Ariana, Ben_Arous, Manouba, Nabeul, Zaghouan, Bizerte, Beja, Jendouba, Kef, Siliana,
        Sousse, Monastir, Mahdia, Sfax, Kairouan, Kasserine, Sidi_Bouzid,
        Gabes, Medenine, Tataouine, Gafsa, Tozeur, Kebili
    }

    //public enum Status {
       // ACTIVE, INACTIVE
    //}

  // ===== PROPRIÉTÉS de bahija =====
  @Column(name = "current_workload")
  private Integer currentWorkload = 0;

  @Column(name = "available")
  private Boolean available = true;

  @Column(name = "performance_score")
  private Integer performanceScore = 100;

  @Column(name = "active_claims")
  private Integer activeClaims = 0;

  @Column(name = "average_processing_time")
  private Double averageProcessingTime;

  @Column(name = "validation_rate")
  private Double validationRate;

  @Column(name = "max_workload")
  private Integer maxWorkload;

  @Column(name = "last_assignment_date")
  private LocalDateTime lastAssignmentDate;

  @OneToMany(mappedBy = "expert")
  @JsonIgnore
  private List<Claim> claims;


  // ===== CONSTRUCTORS =====
    public ExpertHassen() {
    }

    public ExpertHassen(String lastName, String firstName, String address, String city,
                        String postalCode, String email, String phone, String fax,
                        String specialty, ExpertStatus status, InterventionZone interventionZone,
                        LocalDate registrationDate, Integer yearsOfExperience) {
        this.lastName = lastName;
        this.firstName = firstName;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.email = email;
        this.phone = phone;
        this.fax = fax;
        this.specialty = specialty;
        this.status = status;
        this.interventionZone = interventionZone;
        this.registrationDate = registrationDate;
        this.yearsOfExperience = yearsOfExperience;
    }

    // ===== GETTERS & SETTERS =====
    public Integer getIdExpert() { return idExpert; }
    public void setIdExpert(Integer idExpert) { this.idExpert = idExpert; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getFax() { return fax; }
    public void setFax(String fax) { this.fax = fax; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public ExpertStatus getStatus() { return status; }
    public void setStatus(ExpertStatus status) { this.status = status; }

    public InterventionZone getInterventionZone() { return interventionZone; }
    public void setInterventionZone(InterventionZone interventionZone) { this.interventionZone = interventionZone; }

    public LocalDate getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(LocalDate registrationDate) { this.registrationDate = registrationDate; }

    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public List<ExpertReportHassen> getExpertReports() { return expertReports; }
    public void setExpertReports(List<ExpertReportHassen> expertReports) { this.expertReports = expertReports; }

  // propriétés de bahija
  public Integer getCurrentWorkload() { return currentWorkload; }
  public void setCurrentWorkload(Integer currentWorkload) { this.currentWorkload = currentWorkload; }

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

  public Integer getMaxWorkload() { return maxWorkload; }
  public void setMaxWorkload(Integer maxWorkload) { this.maxWorkload = maxWorkload; }

  public LocalDateTime getLastAssignmentDate() { return lastAssignmentDate; }
  public void setLastAssignmentDate(LocalDateTime lastAssignmentDate) { this.lastAssignmentDate = lastAssignmentDate; }

  public List<Claim> getClaims() { return claims; }
  public void setClaims(List<Claim> claims) { this.claims = claims; }


}
