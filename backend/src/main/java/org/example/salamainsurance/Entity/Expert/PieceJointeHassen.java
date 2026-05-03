package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "piece_jointe")
public class PieceJointeHassen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_piece_jointe")
    private Integer idPieceJointe;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", length = 30, nullable = false)
    private TypeDocument typeDocument;

    @Column(name = "nombre")
    private Integer nombre;

    @Column(name = "chemin_fichier", length = 500)
    private String cheminFichier;

    @Column(name = "nom_fichier", length = 255)
    private String nomFichier;

    @Column(name = "description", length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_rapport", nullable = true)
    @JsonIgnoreProperties({"dommages", "mainsOeuvre", "piecesJointes", "photos", "hibernateLazyInitializer", "handler"})
    private ExpertReportHassen rapportExpertise;

    // ===== ENUMS =====
    public enum TypeDocument {
        PHOTO, FACTURE, RECU, COPIE, AUTRE
    }

    // ===== CONSTRUCTORS =====
    public PieceJointeHassen() {}

    // ===== GETTERS & SETTERS =====
    public Integer getIdPieceJointe() { return idPieceJointe; }
    public void setIdPieceJointe(Integer idPieceJointe) { this.idPieceJointe = idPieceJointe; }

    public TypeDocument getTypeDocument() { return typeDocument; }
    public void setTypeDocument(TypeDocument typeDocument) { this.typeDocument = typeDocument; }

    public Integer getNombre() { return nombre; }
    public void setNombre(Integer nombre) { this.nombre = nombre; }

    public String getCheminFichier() { return cheminFichier; }
    public void setCheminFichier(String cheminFichier) { this.cheminFichier = cheminFichier; }

    public String getNomFichier() { return nomFichier; }
    public void setNomFichier(String nomFichier) { this.nomFichier = nomFichier; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ExpertReportHassen getRapportExpertise() { return rapportExpertise; }
    public void setRapportExpertise(ExpertReportHassen rapportExpertise) { this.rapportExpertise = rapportExpertise; }
}
