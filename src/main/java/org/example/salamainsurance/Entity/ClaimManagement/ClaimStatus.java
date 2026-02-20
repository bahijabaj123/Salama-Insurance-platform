package org.example.salamainsurance.Entity.ClaimManagement;

public enum ClaimStatus {
  OPENED,                 // sinistre ouvert
  ASSIGNED_TO_EXPERT,     // expert affecté
  IN_PROGRESS,            // expert travaille dessus
  WAITING_FOR_INFORMATION,
  EXPERT_REPORT_SUBMITTED,
  APPROVED_BY_INSURER,
  REJECTED_BY_INSURER,
  CANCELLED,       // Annulé
  CLOSED
}
