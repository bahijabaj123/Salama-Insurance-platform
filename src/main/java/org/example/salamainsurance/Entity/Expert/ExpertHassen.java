package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

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

    @Column(name = "specialty", length = 100)
    private String specialty;

    @Column(name = "email", length = 150, nullable = false, unique = true)
    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10)
    private Status status;

    @Column(name = "phone", length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "intervention_zone", length = 20)
    private InterventionZone interventionZone;

    @Column(name = "registration_date")
    @NotNull(message = "Registration date is mandatory")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate registrationDate;

    @Column(name = "years_of_experience")
    @Min(value = 0, message = "Years of experience must be positive")
    private Integer yearsOfExperience;

    // ===== ENUMS =====
    public enum InterventionZone {
        Tunis, Ariana, Ben_Arous, Manouba, Nabeul, Zaghouan, Bizerte, Beja, Jendouba, Kef, Siliana,
        Sousse, Monastir, Mahdia, Sfax, Kairouan, Kasserine, Sidi_Bouzid,
        Gabes, Medenine, Tataouine, Gafsa, Tozeur, Kebili
    }

    public enum Status {
        ACTIVE, INACTIVE
    }

    // ===== CONSTRUCTORS =====
    public ExpertHassen() {
    }

    public ExpertHassen(String lastName, String firstName, String specialty, String email,
                        Status status, String phone,
                        InterventionZone interventionZone, LocalDate registrationDate,
                        Integer yearsOfExperience) {

        this.lastName = lastName;
        this.firstName = firstName;
        this.specialty = specialty;
        this.email = email;
        this.status = status;
        this.phone = phone;
        this.interventionZone = interventionZone;
        this.registrationDate = registrationDate;
        this.yearsOfExperience = yearsOfExperience;
    }

    // ===== GETTERS & SETTERS =====

    public Integer getIdExpert() {
        return idExpert;
    }

    public void setIdExpert(Integer idExpert) {
        this.idExpert = idExpert;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getSpecialty() {
        return specialty;
    }

    public void setSpecialty(String specialty) {
        this.specialty = specialty;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public InterventionZone getInterventionZone() {
        return interventionZone;
    }

    public void setInterventionZone(InterventionZone interventionZone) {
        this.interventionZone = interventionZone;
    }

    public LocalDate getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDate registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Integer getYearsOfExperience() {
        return yearsOfExperience;
    }

    public void setYearsOfExperience(Integer yearsOfExperience) {
        this.yearsOfExperience = yearsOfExperience;
    }
}
