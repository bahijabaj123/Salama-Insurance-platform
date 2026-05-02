package org.example.salamainsurance.DTO;

import lombok.Data;

@Data
public class ChatRequest {
  private String message;
  private Long claimId; // Optionnel, pour contexte
  private String userId;
  private String userType; // CLIENT, EXPERT, ASSUREUR
}

