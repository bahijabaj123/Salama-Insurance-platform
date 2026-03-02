package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import lombok.Data;


import java.time.LocalDateTime;

@Entity
@Data
public class ComplaintSarra {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
    private IndemnitySarra indemnity;

    public ComplaintSarra() {
        this.createdAt = LocalDateTime.now();
        this.status = ComplaintStatus.PENDING;
    }

  public Long getIdComplaint() {
    return idComplaint;
  }

  public void setIdComplaint(Long idComplaint) {
    this.idComplaint = idComplaint;
  }

  public IndemnitySarra getIndemnity() {
    return indemnity;
  }

  public void setIndemnity(IndemnitySarra indemnity) {
    this.indemnity = indemnity;
  }

  public ComplaintStatus getStatus() {
    return status;
  }

  public void setStatus(ComplaintStatus status) {
    this.status = status;
  }

  public String getPriority() {
    return priority;
  }

  public void setPriority(String priority) {
    this.priority = priority;
  }

  public String getDetectedSentiment() {
    return detectedSentiment;
  }

  public void setDetectedSentiment(String detectedSentiment) {
    this.detectedSentiment = detectedSentiment;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  private String sentiment;
    private String sentiment; // Ajoutez cette ligne

}
