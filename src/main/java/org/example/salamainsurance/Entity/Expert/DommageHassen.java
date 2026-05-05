package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;

@Entity
@Table(name = "dommage")
public class DommageHassen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_dommage")
    private Integer idDommage;

    @Column(name = "designation", length = 150, nullable = false)
    private String designation;

    @Column(name = "point_choc", length = 50)
    private String pointChoc;

    @Column(name = "montant", precision = 12, scale = 3)
    private BigDecimal montant;

    @Column(name = "taux_tva", precision = 5, scale = 2)
    private BigDecimal tauxTva;

    @Column(name = "est_occasion")
    private Boolean estOccasion;

    @Column(name = "quantite")
    private Integer quantite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_rapport", nullable = true)
    @JsonIgnoreProperties({"dommages", "mainsOeuvre", "piecesJointes", "photos", "hibernateLazyInitializer", "handler"})
    private ExpertReportHassen rapportExpertise;

    // ===== CONSTRUCTORS =====
    public DommageHassen() {}

    public DommageHassen(String designation, String pointChoc, BigDecimal montant,
                         BigDecimal tauxTva, Boolean estOccasion, Integer quantite,
                         ExpertReportHassen rapportExpertise) {
        this.designation = designation;
        this.pointChoc = pointChoc;
        this.montant = montant;
        this.tauxTva = tauxTva;
        this.estOccasion = estOccasion;
        this.quantite = quantite;
        this.rapportExpertise = rapportExpertise;
    }

    // ===== GETTERS & SETTERS =====
    public Integer getIdDommage() { return idDommage; }
    public void setIdDommage(Integer idDommage) { this.idDommage = idDommage; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getPointChoc() { return pointChoc; }
    public void setPointChoc(String pointChoc) { this.pointChoc = pointChoc; }

    public BigDecimal getMontant() { return montant; }
    public void setMontant(BigDecimal montant) { this.montant = montant; }

    public BigDecimal getTauxTva() { return tauxTva; }
    public void setTauxTva(BigDecimal tauxTva) { this.tauxTva = tauxTva; }

    public Boolean getEstOccasion() { return estOccasion; }
    public void setEstOccasion(Boolean estOccasion) { this.estOccasion = estOccasion; }

    public Integer getQuantite() { return quantite; }
    public void setQuantite(Integer quantite) { this.quantite = quantite; }

    public ExpertReportHassen getRapportExpertise() { return rapportExpertise; }
    public void setRapportExpertise(ExpertReportHassen rapportExpertise) { this.rapportExpertise = rapportExpertise; }
}
