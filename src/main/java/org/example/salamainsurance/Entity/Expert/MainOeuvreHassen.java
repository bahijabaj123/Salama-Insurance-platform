package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@Entity
@Table(name = "main_oeuvre")
public class MainOeuvreHassen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_main_oeuvre")
    private Integer idMainOeuvre;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_travail", length = 30, nullable = false)
    private TypeTravail typeTravail;

    @Column(name = "montant", precision = 12, scale = 3)
    private BigDecimal montant;

    @Column(name = "taux_tva", precision = 5, scale = 2)
    private BigDecimal tauxTva;

    @Column(name = "description", length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_rapport", nullable = true)
    @JsonIgnoreProperties({"dommages", "mainsOeuvre", "piecesJointes", "photos", "hibernateLazyInitializer", "handler"})
    private ExpertReportHassen rapportExpertise;

    // ===== ENUMS =====
    public enum TypeTravail {
        TOLERIE, MECANIQUE, ELECTRICITE, PEINTURE
    }

    // ===== CONSTRUCTORS =====
    public MainOeuvreHassen() {}

    // ===== GETTERS & SETTERS =====
    public Integer getIdMainOeuvre() { return idMainOeuvre; }
    public void setIdMainOeuvre(Integer idMainOeuvre) { this.idMainOeuvre = idMainOeuvre; }

    public TypeTravail getTypeTravail() { return typeTravail; }
    public void setTypeTravail(TypeTravail typeTravail) { this.typeTravail = typeTravail; }

    public BigDecimal getMontant() { return montant; }
    public void setMontant(BigDecimal montant) { this.montant = montant; }

    public BigDecimal getTauxTva() { return tauxTva; }
    public void setTauxTva(BigDecimal tauxTva) { this.tauxTva = tauxTva; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ExpertReportHassen getRapportExpertise() { return rapportExpertise; }
    public void setRapportExpertise(ExpertReportHassen rapportExpertise) { this.rapportExpertise = rapportExpertise; }
}
