package org.example.salamainsurance.Entity;

/*import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
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
}
*/