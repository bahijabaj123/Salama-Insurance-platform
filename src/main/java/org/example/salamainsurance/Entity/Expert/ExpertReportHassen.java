package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rapport_expertise")
public class ExpertReportHassen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_rapport")
    private Integer idRapport;

    @Column(name = "numero_reference", length = 50, unique = true)
    private String numeroReference;

    @Column(name = "date_mission")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateMission;

    @Column(name = "date_accident")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateAccident;

    @Column(name = "date_examen")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateExamen;

    @Column(name = "lieu_examen", length = 100)
    private String lieuExamen;

    @Column(name = "observation", columnDefinition = "TEXT")
    private String observation;

    // ===== Informations Assuré =====
    @Column(name = "assure_nom", length = 150)
    private String assureNom;

    @Column(name = "assure_contrat", length = 50)
    private String assureContrat;

    @Column(name = "assure_dossier", length = 50)
    private String assureDossier;

    // ===== Informations Assurance (Mandant) =====
    @Column(name = "mandant_assurance", length = 100)
    private String mandantAssurance;

    @Column(name = "mandant_agence", length = 50)
    private String mandantAgence;

    // ===== Informations Tiers =====
    @Column(name = "tiers_nom", length = 150)
    private String tiersNom;

    @Column(name = "tiers_contrat", length = 50)
    private String tiersContrat;

    @Column(name = "tiers_assurance", length = 100)
    private String tiersAssurance;

    @Column(name = "tiers_immatriculation", length = 20)
    private String tiersImmatriculation;

    // ===== Informations Véhicule Assuré =====
    @Column(name = "vehicule_marque", length = 50)
    private String vehiculeMarque;

    @Column(name = "vehicule_type", length = 50)
    private String vehiculeType;

    @Column(name = "vehicule_immatriculation", length = 20)
    private String vehiculeImmatriculation;

    @Column(name = "vehicule_genre", length = 20)
    private String vehiculeGenre;

    @Column(name = "vehicule_couleur", length = 30)
    private String vehiculeCouleur;

    @Column(name = "vehicule_puissance", length = 10)
    private String vehiculePuissance;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicule_energie", length = 20)
    private TypeEnergie vehiculeEnergie;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicule_etat", length = 20)
    private EtatVehicule vehiculeEtat;

    @Column(name = "vehicule_numero_serie", length = 50)
    private String vehiculeNumeroSerie;

    @Column(name = "vehicule_date_mise_circulation")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate vehiculeDateMiseCirculation;

    @Column(name = "vehicule_index_km")
    private Integer vehiculeIndexKm;

    // ===== Totaux Financiers =====
    @Column(name = "total_fournitures_ht", precision = 12, scale = 3)
    private BigDecimal totalFournituresHT;

    @Column(name = "tva_fournitures", precision = 12, scale = 3)
    private BigDecimal tvaFournitures;

    @Column(name = "total_fournitures_ttc", precision = 12, scale = 3)
    private BigDecimal totalFournituresTTC;

    @Column(name = "total_main_oeuvre_ht", precision = 12, scale = 3)
    private BigDecimal totalMainOeuvreHT;

    @Column(name = "total_main_oeuvre_ttc", precision = 12, scale = 3)
    private BigDecimal totalMainOeuvreTTC;

    @Column(name = "total_general", precision = 12, scale = 3)
    private BigDecimal totalGeneral;

    @Column(name = "remise", precision = 12, scale = 3)
    private BigDecimal remise;

    @Column(name = "vetuste", precision = 12, scale = 3)
    private BigDecimal vetuste;

    @Column(name = "total_net", precision = 12, scale = 3)
    private BigDecimal totalNet;

    // ===== Conclusions =====
    @Column(name = "nature_degats", columnDefinition = "TEXT")
    private String natureDegats;

    @Column(name = "conclusions", columnDefinition = "TEXT")
    private String conclusions;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_rapport", length = 20)
    private ExpertiseStatus  statutRapport;

  // Dans ExpertReportHassen.java
  @ManyToOne
  @JoinColumn(name = "claim_id", nullable = false)
  private Claim claim;


  // =====  PROPRIÉTÉS de bahija =====
  @Column(name = "expertise_date")
  private LocalDateTime expertiseDate;

  @Column(name = "findings", length = 2000)
  private String findings;

  @Column(name = "estimated_repair_cost")
  private Double estimatedRepairCost;

  @Column(name = "estimated_indemnity")
  private Double estimatedIndemnity;


  @ElementCollection
  @CollectionTable(name = "expertise_photos", joinColumns = @JoinColumn(name = "expertise_id"))
  @Column(name = "photo_url")
  private List<String> expertPhotos = new ArrayList<>();

  @Column(name = "is_validated")
  private Boolean isValidated = false;

  @Column(name = "validation_comments")
  private String validationComments;

  @Column(name = "claim_valid")
  private Boolean claimValid;

  @Column(name = "rejection_reason")
  private String rejectionReason;

  @Enumerated(EnumType.STRING)
  @Column(name = "expertise_status")
  private ExpertiseStatus expertiseStatus = ExpertiseStatus.DRAFT;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  @Column(name = "submitted_at")
  private LocalDateTime submittedAt;

    // ===== Relations =====
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_expert", nullable = false)
    private ExpertHassen expert;

    @OneToMany(mappedBy = "rapportExpertise", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DommageHassen> dommages;

    @OneToMany(mappedBy = "rapportExpertise", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MainOeuvreHassen> mainsOeuvre;

    @OneToMany(mappedBy = "rapportExpertise", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PieceJointeHassen> piecesJointes;

    // ===== ENUMS =====
    public enum TypeEnergie {
        ESSENCE, DIESEL, HYBRIDE, ELECTRIQUE, GPL
    }

    public enum EtatVehicule {
        BON, ASSEZ_BON, MOYEN, MAUVAIS, EPAVE
    }

    //public enum StatutRapport {
     //   EN_COURS, TERMINE, VALIDE, ANNULE
    //}

    // ===== CONSTRUCTORS =====
    public ExpertReportHassen() {}

    // ===== GETTERS & SETTERS =====
    public Integer getIdRapport() { return idRapport; }
    public void setIdRapport(Integer idRapport) { this.idRapport = idRapport; }

    public String getNumeroReference() { return numeroReference; }
    public void setNumeroReference(String numeroReference) { this.numeroReference = numeroReference; }

    public LocalDate getDateMission() { return dateMission; }
    public void setDateMission(LocalDate dateMission) { this.dateMission = dateMission; }

    public LocalDate getDateAccident() { return dateAccident; }
    public void setDateAccident(LocalDate dateAccident) { this.dateAccident = dateAccident; }

    public LocalDate getDateExamen() { return dateExamen; }
    public void setDateExamen(LocalDate dateExamen) { this.dateExamen = dateExamen; }

    public String getLieuExamen() { return lieuExamen; }
    public void setLieuExamen(String lieuExamen) { this.lieuExamen = lieuExamen; }

    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }

    public String getAssureNom() { return assureNom; }
    public void setAssureNom(String assureNom) { this.assureNom = assureNom; }

    public String getAssureContrat() { return assureContrat; }
    public void setAssureContrat(String assureContrat) { this.assureContrat = assureContrat; }

    public String getAssureDossier() { return assureDossier; }
    public void setAssureDossier(String assureDossier) { this.assureDossier = assureDossier; }

    public String getMandantAssurance() { return mandantAssurance; }
    public void setMandantAssurance(String mandantAssurance) { this.mandantAssurance = mandantAssurance; }

    public String getMandantAgence() { return mandantAgence; }
    public void setMandantAgence(String mandantAgence) { this.mandantAgence = mandantAgence; }

    public String getTiersNom() { return tiersNom; }
    public void setTiersNom(String tiersNom) { this.tiersNom = tiersNom; }

    public String getTiersContrat() { return tiersContrat; }
    public void setTiersContrat(String tiersContrat) { this.tiersContrat = tiersContrat; }

    public String getTiersAssurance() { return tiersAssurance; }
    public void setTiersAssurance(String tiersAssurance) { this.tiersAssurance = tiersAssurance; }

    public String getTiersImmatriculation() { return tiersImmatriculation; }
    public void setTiersImmatriculation(String tiersImmatriculation) { this.tiersImmatriculation = tiersImmatriculation; }

    public String getVehiculeMarque() { return vehiculeMarque; }
    public void setVehiculeMarque(String vehiculeMarque) { this.vehiculeMarque = vehiculeMarque; }

    public String getVehiculeType() { return vehiculeType; }
    public void setVehiculeType(String vehiculeType) { this.vehiculeType = vehiculeType; }

    public String getVehiculeImmatriculation() { return vehiculeImmatriculation; }
    public void setVehiculeImmatriculation(String vehiculeImmatriculation) { this.vehiculeImmatriculation = vehiculeImmatriculation; }

    public String getVehiculeGenre() { return vehiculeGenre; }
    public void setVehiculeGenre(String vehiculeGenre) { this.vehiculeGenre = vehiculeGenre; }

    public String getVehiculeCouleur() { return vehiculeCouleur; }
    public void setVehiculeCouleur(String vehiculeCouleur) { this.vehiculeCouleur = vehiculeCouleur; }

    public String getVehiculePuissance() { return vehiculePuissance; }
    public void setVehiculePuissance(String vehiculePuissance) { this.vehiculePuissance = vehiculePuissance; }

    public TypeEnergie getVehiculeEnergie() { return vehiculeEnergie; }
    public void setVehiculeEnergie(TypeEnergie vehiculeEnergie) { this.vehiculeEnergie = vehiculeEnergie; }

    public EtatVehicule getVehiculeEtat() { return vehiculeEtat; }
    public void setVehiculeEtat(EtatVehicule vehiculeEtat) { this.vehiculeEtat = vehiculeEtat; }

    public String getVehiculeNumeroSerie() { return vehiculeNumeroSerie; }
    public void setVehiculeNumeroSerie(String vehiculeNumeroSerie) { this.vehiculeNumeroSerie = vehiculeNumeroSerie; }

    public LocalDate getVehiculeDateMiseCirculation() { return vehiculeDateMiseCirculation; }
    public void setVehiculeDateMiseCirculation(LocalDate vehiculeDateMiseCirculation) { this.vehiculeDateMiseCirculation = vehiculeDateMiseCirculation; }

    public Integer getVehiculeIndexKm() { return vehiculeIndexKm; }
    public void setVehiculeIndexKm(Integer vehiculeIndexKm) { this.vehiculeIndexKm = vehiculeIndexKm; }

    public BigDecimal getTotalFournituresHT() { return totalFournituresHT; }
    public void setTotalFournituresHT(BigDecimal totalFournituresHT) { this.totalFournituresHT = totalFournituresHT; }

    public BigDecimal getTvaFournitures() { return tvaFournitures; }
    public void setTvaFournitures(BigDecimal tvaFournitures) { this.tvaFournitures = tvaFournitures; }

    public BigDecimal getTotalFournituresTTC() { return totalFournituresTTC; }
    public void setTotalFournituresTTC(BigDecimal totalFournituresTTC) { this.totalFournituresTTC = totalFournituresTTC; }

    public BigDecimal getTotalMainOeuvreHT() { return totalMainOeuvreHT; }
    public void setTotalMainOeuvreHT(BigDecimal totalMainOeuvreHT) { this.totalMainOeuvreHT = totalMainOeuvreHT; }

    public BigDecimal getTotalMainOeuvreTTC() { return totalMainOeuvreTTC; }
    public void setTotalMainOeuvreTTC(BigDecimal totalMainOeuvreTTC) { this.totalMainOeuvreTTC = totalMainOeuvreTTC; }

    public BigDecimal getTotalGeneral() { return totalGeneral; }
    public void setTotalGeneral(BigDecimal totalGeneral) { this.totalGeneral = totalGeneral; }

    public BigDecimal getRemise() { return remise; }
    public void setRemise(BigDecimal remise) { this.remise = remise; }

    public BigDecimal getVetuste() { return vetuste; }
    public void setVetuste(BigDecimal vetuste) { this.vetuste = vetuste; }

    public BigDecimal getTotalNet() { return totalNet; }
    public void setTotalNet(BigDecimal totalNet) { this.totalNet = totalNet; }

    public String getNatureDegats() { return natureDegats; }
    public void setNatureDegats(String natureDegats) { this.natureDegats = natureDegats; }

    public String getConclusions() { return conclusions; }
    public void setConclusions(String conclusions) { this.conclusions = conclusions; }

    public ExpertiseStatus  getStatutRapport() { return statutRapport; }
    public void setStatutRapport(ExpertiseStatus  statutRapport) { this.statutRapport = statutRapport; }

    public ExpertHassen getExpert() { return expert; }
    public void setExpert(ExpertHassen expert) { this.expert = expert; }

    public List<DommageHassen> getDommages() { return dommages; }
    public void setDommages(List<DommageHassen> dommages) { this.dommages = dommages; }

    public List<MainOeuvreHassen> getMainsOeuvre() { return mainsOeuvre; }
    public void setMainsOeuvre(List<MainOeuvreHassen> mainsOeuvre) { this.mainsOeuvre = mainsOeuvre; }

    public List<PieceJointeHassen> getPiecesJointes() { return piecesJointes; }
    public void setPiecesJointes(List<PieceJointeHassen> piecesJointes) { this.piecesJointes = piecesJointes; }

  // getters/setters de bahija
  public LocalDateTime getExpertiseDate() { return expertiseDate; }
  public void setExpertiseDate(LocalDateTime expertiseDate) { this.expertiseDate = expertiseDate; }

  public String getFindings() { return findings; }
  public void setFindings(String findings) { this.findings = findings; }

  public Double getEstimatedRepairCost() { return estimatedRepairCost; }
  public void setEstimatedRepairCost(Double estimatedRepairCost) { this.estimatedRepairCost = estimatedRepairCost; }

  public Double getEstimatedIndemnity() { return estimatedIndemnity; }
  public void setEstimatedIndemnity(Double estimatedIndemnity) { this.estimatedIndemnity = estimatedIndemnity; }

  public List<String> getExpertPhotos() { return expertPhotos; }
  public void setExpertPhotos(List<String> expertPhotos) { this.expertPhotos = expertPhotos; }

  public Boolean getIsValidated() { return isValidated; }
  public void setIsValidated(Boolean isValidated) { this.isValidated = isValidated; }

  public String getValidationComments() { return validationComments; }
  public void setValidationComments(String validationComments) { this.validationComments = validationComments; }

  public Boolean getClaimValid() { return claimValid; }
  public void setClaimValid(Boolean claimValid) { this.claimValid = claimValid; }

  public String getRejectionReason() { return rejectionReason; }
  public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

  public ExpertiseStatus getExpertiseStatus() { return expertiseStatus; }
  public void setExpertiseStatus(ExpertiseStatus expertiseStatus) { this.expertiseStatus = expertiseStatus; }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

  public LocalDateTime getSubmittedAt() { return submittedAt; }
  public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }


}
