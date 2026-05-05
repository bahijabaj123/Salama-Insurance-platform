package org.example.salamainsurance.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Document {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String fileName;

  private String fileType;

  private Long fileSize;

  private String filePath;

  @Column(name = "claim_id")
  private Long claimId;

  @Column(name = "upload_date")
  private LocalDateTime uploadDate;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "claim_id", insertable = false, updatable = false)
  private Claim claim;

  @PrePersist
  protected void onCreate() {
    uploadDate = LocalDateTime.now();
  }
}
