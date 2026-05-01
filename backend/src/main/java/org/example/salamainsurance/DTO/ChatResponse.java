package org.example.salamainsurance.DTO;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ChatResponse {
  private String message;
  private String sender; // "bot" ou "user"
  private LocalDateTime timestamp;
  private String intent; // "info_claim", "status", "estimate", etc.
  private Object metadata; // Données additionnelles
}
