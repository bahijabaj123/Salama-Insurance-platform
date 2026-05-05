package org.example.salamainsurance.Service.Notification;

import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@EnableScheduling
@Slf4j
public class ScheduledEmailService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private EnhancedEmailService enhancedEmailService;

  @Autowired
  private NotificationService notificationService;

  // 1. Rappel quotidien pour les experts (tous les jours à 8h du matin)
  @Scheduled(cron = "0 0 8 * * *")
  public void remindExpertsDaily() {
    log.info("🔔 Envoi des rappels quotidiens aux experts");

    // Trouver les sinistres assignés depuis plus de 24h sans rapport
    LocalDateTime deadline = LocalDateTime.now().minusHours(24);
    List<Claim> pendingClaims = claimRepository.findByStatusAndAssignedDateBefore(
      ClaimStatus.ASSIGNED_TO_EXPERT, deadline);

    for (Claim claim : pendingClaims) {
      if (claim.getExpert() != null) {
        String message = String.format(
          "Rappel: Le sinistre %s vous a été assigné il y a plus de 24h. " +
            "Veuillez soumettre votre rapport d'expertise.",
          claim.getReference());

        notificationService.sendToExpert(claim.getExpert(), message);
        log.info("📧 Rappel envoyé à l'expert {} pour le sinistre {}",
          claim.getExpert().getEmail(), claim.getReference());
      }
    }
  }

  // 2. Alerte pour les sinistres urgents non traités (toutes les 4 heures)
  @Scheduled(cron = "0 0 */4 * * *")
  public void alertUrgentClaims() {
    log.info("🚨 Vérification des sinistres urgents");

    List<Claim> urgentClaims = claimRepository.findByUrgencyScoreGreaterThan(70);

    for (Claim claim : urgentClaims) {
      if (claim.getStatus() == ClaimStatus.OPENED) {
        // Alerter les gestionnaires
        String message = String.format(
          "URGENT: Sinistre %s avec score d'urgence %d non assigné depuis %s",
          claim.getReference(),
          claim.getUrgencyScore(),
          claim.getOpeningDate());

        // Envoyer aux assureurs (à adapter selon ta logique)
        log.warn("⚠️ Sinistre urgent non traité: {}", message);
      }
    }
  }

  // 3. Résumé hebdomadaire (tous les lundis à 9h)
  @Scheduled(cron = "0 0 9 * * MON")
  public void sendWeeklySummary() {
    log.info("📊 Envoi du résumé hebdomadaire");

    LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

    long newClaims = claimRepository.countByOpeningDateAfter(weekAgo);
    long closedClaims = claimRepository.countByClosingDateAfter(weekAgo);

    String summary = String.format(
      "Résumé hebdomadaire:\n" +
        "- Nouveaux sinistres: %d\n" +
        "- Sinistres clôturés: %d\n" +
        "- En cours: %d",
      newClaims,
      closedClaims,
      claimRepository.countByStatus(ClaimStatus.ASSIGNED_TO_EXPERT));

    log.info(summary);
    // Ici tu pourrais envoyer ce résumé aux managers
  }

  // 4. Nettoyage des notifications en échec (toutes les 2 heures)
  @Scheduled(cron = "0 0 */2 * * *")
  public void retryFailedNotifications() {
    log.info("🔄 Tentative de renvoi des notifications en échec");
    // Cette logique pourrait être dans NotificationService
  }

  // 5. Test manuel (toutes les minutes pour tester)
  // @Scheduled(fixedDelay = 60000) // 60 secondes
  public void testScheduler() {
    log.info("⏰ Test du scheduler - " + LocalDateTime.now());
  }
}
