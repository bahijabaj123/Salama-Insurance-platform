package org.example.salamainsurance.Entity.Fraud;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FraudRule {
  private String code;        // R1, R2, etc.
  private String description; // Description de la règle
  private int weight;         // Poids en points
  private boolean triggered;  // Si la règle est déclenchée
  private String details;     // Détails spécifiques
}
