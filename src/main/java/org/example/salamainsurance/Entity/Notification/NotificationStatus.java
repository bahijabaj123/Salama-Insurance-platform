package org.example.salamainsurance.Entity.Notification;

public enum NotificationStatus {
  PENDING,    // En attente d'envoi
  SENT,       // Envoyé avec succès
  FAILED,     // Échec permanent
  RETRY       // À réessayer plus tard
}
