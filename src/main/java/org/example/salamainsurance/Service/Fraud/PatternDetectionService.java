package org.example.salamainsurance.Service.Fraud;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.Fraud.FraudAnalysisRepository;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.example.salamainsurance.Service.Notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@EnableScheduling
@Slf4j
public class PatternDetectionService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private AccidentRepository accidentRepository;

  @Autowired
  private FraudAnalysisRepository fraudAnalysisRepository;

  @Autowired
  private NotificationService notificationService;

  @PersistenceContext
  private EntityManager entityManager;


  // Map pour stocker les patterns en mémoire
  private Map<String, PatternCounter> patternCounters = new HashMap<>();

  @Data
  public static class PatternCounter {
    private int count = 0;
    private List<String> details = new ArrayList<>();
    private String riskLevel = "MEDIUM";

    public PatternCounter() {}

    public void increment() {
      count++;
    }

    public void addDetails(String detail) {
      details.add(detail);
    }

    public void setRiskLevel(String riskLevel) {
      this.riskLevel = riskLevel;
    }
  }

  @Scheduled(fixedDelay = 3600000) // Toutes les heures
  public void detectPatterns() {
    log.info("🔍 Démarrage de la détection de patterns suspects");

    // Réinitialiser les compteurs
    patternCounters.clear();

    // 1. Détection des patterns temporels
    detectTemporalPatterns();

    // 2. Détection des patterns géographiques
    detectGeographicPatterns();

    // 3. Détection des patterns de réseau
    detectNetworkPatterns();

    // 4. Génération d'alertes
    generateAlerts();

    log.info("✅ Détection de patterns terminée");
  }

  private void detectTemporalPatterns() {
    LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);

    // Récupérer tous les sinistres du dernier mois
    List<Claim> recentClaims = claimRepository.findByOpeningDateAfter(oneMonthAgo);

    // Grouper par client (si client existe)
    Map<Long, List<Claim>> claimsByClient = recentClaims.stream()
      .filter(c -> c.getClient() != null && c.getClient().getId() != null)
      .collect(Collectors.groupingBy(c -> c.getClient().getId()));

    for (Map.Entry<Long, List<Claim>> entry : claimsByClient.entrySet()) {
      List<Claim> clientClaims = entry.getValue();

      // Pattern 1: Plus de 3 sinistres en 1 mois
      if (clientClaims.size() >= 3) {
        String patternKey = "MULTIPLE_CLAIMS_" + entry.getKey();

        PatternCounter counter = patternCounters
          .computeIfAbsent(patternKey, k -> new PatternCounter());

        counter.increment();
        counter.addDetails("Client " + entry.getKey() +
          " a déclaré " + clientClaims.size() + " sinistres en 1 mois");

        // Vérifier si les sinistres sont de nuit
        long nightClaims = clientClaims.stream()
          .filter(this::isNightAccident)
          .count();

        if (nightClaims >= 2) {
          counter.addDetails(" - Dont " + nightClaims + " de nuit");
          counter.setRiskLevel("HIGH");
        }
      }
    }
  }

  private void detectGeographicPatterns() {
    LocalDate threeMonthsAgo = LocalDate.now().minusMonths(3);

    // Récupérer tous les accidents des 3 derniers mois
    List<Accident> recentAccidents = accidentRepository.findAll().stream()
      .filter(a -> a.getAccidentDate() != null &&
        a.getAccidentDate().isAfter(threeMonthsAgo))
      .collect(Collectors.toList());

    // Grouper par lieu
    Map<String, List<Accident>> accidentsByLocation = recentAccidents.stream()
      .filter(a -> a.getLocation() != null)
      .collect(Collectors.groupingBy(Accident::getLocation));

    for (Map.Entry<String, List<Accident>> entry : accidentsByLocation.entrySet()) {
      List<Accident> locationAccidents = entry.getValue();

      // Pattern: Plus de 5 accidents au même endroit
      if (locationAccidents.size() >= 5) {
        String patternKey = "HOTSPOT_" + entry.getKey();

        PatternCounter counter = patternCounters
          .computeIfAbsent(patternKey, k -> new PatternCounter());

        counter.increment();
        counter.addDetails(locationAccidents.size() +
          " accidents à " + entry.getKey() + " en 3 mois");

        // ✅ Version simplifiée SANS accidentCircumstances
        // On utilise juste le nombre d'accidents comme indicateur
        if (locationAccidents.size() >= 10) {
          counter.setRiskLevel("HIGH");
          counter.addDetails(" - Zone à très haute fréquence d'accidents");
        } else if (locationAccidents.size() >= 7) {
          counter.setRiskLevel("MEDIUM");
          counter.addDetails(" - Zone à fréquence élevée d'accidents");
        }
      }
    }
  }

  private void detectNetworkPatterns() {
    // Pattern: Mêmes personnes impliquées dans plusieurs accidents
    // Note: Cette requête dépend de ta structure de base de données
    // Adaptation simple pour l'instant
    log.info("Détection des patterns de réseau (simplifiée)");
  }

  private void generateAlerts() {
    for (Map.Entry<String, PatternCounter> entry : patternCounters.entrySet()) {
      PatternCounter counter = entry.getValue();

      // Seulement les patterns avec un score significatif
      if (counter.getCount() >= 3) {
        String alert = String.format(
          "🔴 PATTERN SUSPECT DÉTECTÉ: %s\n" +
            "Fréquence: %d occurrences\n" +
            "Niveau de risque: %s\n" +
            "Détails:\n%s",
          entry.getKey(),
          counter.getCount(),
          counter.getRiskLevel(),
          String.join("\n", counter.getDetails())
        );

        log.warn(alert);

        // Envoyer aux gestionnaires
        // notificationService.sendToManagers(alert);
      }
    }
  }

  private boolean isNightAccident(Claim claim) {
    if (claim.getAccident() == null || claim.getAccident().getTime() == null) {
      return false;
    }
    int hour = claim.getAccident().getTime().getHour();
    return hour >= 23 || hour <= 5;
  }

  // Méthode pour tester manuellement
  public void runManualDetection() {
    log.info("🔍 Lancement manuel de la détection de patterns");
    detectPatterns();
  }
}
