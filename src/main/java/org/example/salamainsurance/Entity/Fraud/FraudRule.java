package org.example.salamainsurance.Entity.Fraud;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class FraudRule {
  private String code;        // R1, R2, etc.
  private String description; // Description de la règle
  private int weight;         // Poids en points
  private boolean triggered;  // Si la règle est déclenchée
  private String details;     // Détails spécifiques
}
