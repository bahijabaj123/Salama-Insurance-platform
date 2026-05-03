package org.example.salamainsurance.Entity.notification;

public enum NotificationStatus {
  PENDING,    // En attente d'envoi
  SENT,       // Envoyé avec succès
  FAILED,     // Échec permanent
  RETRY       // À réessayer plus tard
}
