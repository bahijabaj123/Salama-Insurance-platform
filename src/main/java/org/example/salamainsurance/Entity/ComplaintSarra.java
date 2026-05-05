package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaint_sarra")
@Data
public class ComplaintSarra {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id_complaint")
  private Long idComplaint;

  private String title;

  @Column(columnDefinition = "TEXT")
  private String description;

  private LocalDateTime createdAt;

  private String detectedSentiment;

  private String priority;

  @Enumerated(EnumType.STRING)
  private ComplaintStatus status;

  @ManyToOne
  @JoinColumn(name = "indemnity_id", referencedColumnName = "id_indemnity")
  private IndemnitySarra indemnity;

  private String sentiment;

  // ===== CHAMPS POUR LA RÉPONSE DE L'ASSUREUR =====
  @Column(columnDefinition = "TEXT")
  private String response;           // Réponse de l'assureur
  @Column(name = "has_profanity")
  private Boolean hasProfanity = false;
  @Column(name = "response_date")
  private LocalDateTime responseDate; // Date de la réponse    @Column(name = "responded_by")
  private String respondedBy;         // Nom de l'assureur qui a répondu
  @Column(name = "claim_id")
  private Long claimId;
  // ===== CONSTRUCTEUR =====
  public ComplaintSarra() {
    this.createdAt = LocalDateTime.now();
    this.status = ComplaintStatus.PENDING;
  }

  // ===== GETTERS ET SETTERS =====
  public Long getIdComplaint() {
    return idComplaint;
  }

  public void setIdComplaint(Long idComplaint) {
    this.idComplaint = idComplaint;
  }
  public Boolean getHasProfanity() { return hasProfanity; }
  public void setHasProfanity(Boolean hasProfanity) { this.hasProfanity = hasProfanity; }
  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getDetectedSentiment() {
    return detectedSentiment;
  }
  public Long getClaimId() { return claimId; }
  public void setClaimId(Long claimId) { this.claimId = claimId; }

  public void setDetectedSentiment(String detectedSentiment) {
    this.detectedSentiment = detectedSentiment;
  }

  public String getPriority() {
    return priority;
  }

  public void setPriority(String priority) {
    this.priority = priority;
  }

  public ComplaintStatus getStatus() {
    return status;
  }

  public void setStatus(ComplaintStatus status) {
    this.status = status;
  }

  public IndemnitySarra getIndemnity() {
    return indemnity;
  }

  public void setIndemnity(IndemnitySarra indemnity) {
    this.indemnity = indemnity;
  }

  public String getSentiment() {
    return sentiment;
  }

  public void setSentiment(String sentiment) {
    this.sentiment = sentiment;
  }

  public String getResponse() {
    return response;
  }

  public void setResponse(String response) {
    this.response = response;
  }

  public LocalDateTime getResponseDate() {
    return responseDate;
  }

  public void setResponseDate(LocalDateTime responseDate) {
    this.responseDate = responseDate;
  }

  public String getRespondedBy() {
    return respondedBy;
  }

  public void setRespondedBy(String respondedBy) {
    this.respondedBy = respondedBy;
  }
}
