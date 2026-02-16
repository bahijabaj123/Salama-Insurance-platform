package org.example.salamainsurance.Entity.Expert;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "expert_report")
public class ExpertReportHassen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_activity")
    private Integer idActivity;

    // Relation plusieurs rapports -> un expert
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_expert", nullable = false)
    private ExpertHassen expert;

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false, length = 30)
    private ActivityType activityType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private ActivityStatus status;

    @Column(name = "image_links", columnDefinition = "TEXT")
    private String imageLinks;

    @Column(name = "damage_analysis", columnDefinition = "TEXT")
    private String damageAnalysis;

    @Column(name = "affected_parts", columnDefinition = "TEXT")
    private String affectedParts;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity_level", length = 10)
    private SeverityLevel severityLevel;

    @Column(name = "cost_estimate", precision = 10, scale = 2)
    private BigDecimal costEstimate;

    @Column(name = "conclusions", columnDefinition = "TEXT")
    private String conclusions;

    // ===== ENUMS =====
    public enum ActivityType {
        REPORT_RECEPTION,
        IMAGE_ANALYSIS,
        ESTIMATION,
        REPORT_WRITING,
        APPOINTMENT
    }

    public enum ActivityStatus {
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum SeverityLevel {
        MINOR,
        MODERATE,
        SEVERE
    }

    // ===== CONSTRUCTORS =====
    public ExpertReportHassen() {}

    public ExpertReportHassen(ExpertHassen expert,
                              ActivityType activityType,
                              String description,
                              LocalDateTime startDate,
                              LocalDateTime endDate,
                              ActivityStatus status,
                              String imageLinks,
                              String damageAnalysis,
                              String affectedParts,
                              SeverityLevel severityLevel,
                              BigDecimal costEstimate,
                              String conclusions) {
        this.expert = expert;
        this.activityType = activityType;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.imageLinks = imageLinks;
        this.damageAnalysis = damageAnalysis;
        this.affectedParts = affectedParts;
        this.severityLevel = severityLevel;
        this.costEstimate = costEstimate;
        this.conclusions = conclusions;
    }

    // ===== GETTERS & SETTERS =====
    public Integer getIdActivity() { return idActivity; }
    public void setIdActivity(Integer idActivity) { this.idActivity = idActivity; }

    public ExpertHassen getExpert() { return expert; }
    public void setExpert(ExpertHassen expert) { this.expert = expert; }

    public ActivityType getActivityType() { return activityType; }
    public void setActivityType(ActivityType activityType) { this.activityType = activityType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public ActivityStatus getStatus() { return status; }
    public void setStatus(ActivityStatus status) { this.status = status; }

    public String getImageLinks() { return imageLinks; }
    public void setImageLinks(String imageLinks) { this.imageLinks = imageLinks; }

    public String getDamageAnalysis() { return damageAnalysis; }
    public void setDamageAnalysis(String damageAnalysis) { this.damageAnalysis = damageAnalysis; }

    public String getAffectedParts() { return affectedParts; }
    public void setAffectedParts(String affectedParts) { this.affectedParts = affectedParts; }

    public SeverityLevel getSeverityLevel() { return severityLevel; }
    public void setSeverityLevel(SeverityLevel severityLevel) { this.severityLevel = severityLevel; }

    public BigDecimal getCostEstimate() { return costEstimate; }
    public void setCostEstimate(BigDecimal costEstimate) { this.costEstimate = costEstimate; }

    public String getConclusions() { return conclusions; }
    public void setConclusions(String conclusions) { this.conclusions = conclusions; }
}
