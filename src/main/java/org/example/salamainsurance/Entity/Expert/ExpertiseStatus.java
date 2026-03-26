package org.example.salamainsurance.Entity.Expert;

public enum ExpertiseStatus {
  // Valeurs de ExpertiseStatus (vos valeurs)
  DRAFT,        // Brouillon
  SUBMITTED,    // Soumis

  // Valeurs de StatutRapport (valeurs de votre collègue)
  EN_COURS,     // En cours
  TERMINE,      // Terminé
  VALIDE,       // Validé
  REJETE,       // Rejeté (fusion avec REJECTED)
  ANNULE;       // Annulé

  // Méthode utilitaire pour compatibilité
  public boolean isFinal() {
    return this == TERMINE || this == VALIDE || this == REJETE || this == ANNULE;
  }

  public boolean isInProgress() {
    return this == DRAFT || this == SUBMITTED || this == EN_COURS;
  }
}
