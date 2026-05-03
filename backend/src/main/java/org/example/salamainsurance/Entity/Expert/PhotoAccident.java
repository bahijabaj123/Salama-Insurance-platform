package org.example.salamainsurance.Entity.Expert;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "photos_accident")
public class PhotoAccident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idPhoto;

    @Column(nullable = false)
    private String nomFichier;

    @Column(nullable = false)
    private String cheminFichier;

    private String typeMime;

    private Long tailleFichier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypePhoto typePhoto;

    private String description;

    @Column(nullable = false)
    private LocalDateTime dateUpload;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_rapport", nullable = false)
    @JsonIgnore
    private ExpertReportHassen rapport;

    public enum TypePhoto {
        AVANT_VEHICULE,
        ARRIERE_VEHICULE,
        COTE_GAUCHE,
        COTE_DROIT,
        INTERIEUR,
        DEGAT_DETAIL,
        PLAQUE_IMMATRICULATION,
        COMPTEUR_KILOMETRIQUE,
        SCENE_ACCIDENT,
        AUTRE
    }

    public PhotoAccident() {
    }

    public PhotoAccident(Integer idPhoto, String nomFichier, String cheminFichier, String typeMime,
                         Long tailleFichier, TypePhoto typePhoto, String description,
                         LocalDateTime dateUpload, ExpertReportHassen rapport) {
        this.idPhoto = idPhoto;
        this.nomFichier = nomFichier;
        this.cheminFichier = cheminFichier;
        this.typeMime = typeMime;
        this.tailleFichier = tailleFichier;
        this.typePhoto = typePhoto;
        this.description = description;
        this.dateUpload = dateUpload;
        this.rapport = rapport;
    }

    @PrePersist
    protected void onCreate() {
        this.dateUpload = LocalDateTime.now();
    }

    // ========== Getters & Setters ==========

    public Integer getIdPhoto() { return idPhoto; }
    public void setIdPhoto(Integer idPhoto) { this.idPhoto = idPhoto; }

    public String getNomFichier() { return nomFichier; }
    public void setNomFichier(String nomFichier) { this.nomFichier = nomFichier; }

    public String getCheminFichier() { return cheminFichier; }
    public void setCheminFichier(String cheminFichier) { this.cheminFichier = cheminFichier; }

    public String getTypeMime() { return typeMime; }
    public void setTypeMime(String typeMime) { this.typeMime = typeMime; }

    public Long getTailleFichier() { return tailleFichier; }
    public void setTailleFichier(Long tailleFichier) { this.tailleFichier = tailleFichier; }

    public TypePhoto getTypePhoto() { return typePhoto; }
    public void setTypePhoto(TypePhoto typePhoto) { this.typePhoto = typePhoto; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getDateUpload() { return dateUpload; }
    public void setDateUpload(LocalDateTime dateUpload) { this.dateUpload = dateUpload; }

    public ExpertReportHassen getRapport() { return rapport; }
    public void setRapport(ExpertReportHassen rapport) { this.rapport = rapport; }
}
