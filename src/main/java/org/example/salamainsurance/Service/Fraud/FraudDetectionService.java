package org.example.salamainsurance.Service.Fraud;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Fraud.FraudAnalysis;
import org.example.salamainsurance.Entity.Fraud.FraudRule;
import org.example.salamainsurance.Entity.Fraud.RiskLevel;
import org.example.salamainsurance.Entity.Report.Driver;
import org.example.salamainsurance.Entity.Report.DriverType;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.Fraud.FraudAnalysisRepository;
import org.example.salamainsurance.Service.Notification.EmailService;
import org.example.salamainsurance.Service.Notification.EnhancedEmailService;
import org.example.salamainsurance.Service.Notification.NotificationService;
import org.example.salamainsurance.Service.Notification.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.example.salamainsurance.Entity.Fraud.RiskLevel.HIGH;

@Service
@Slf4j
public class FraudDetectionService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private FraudAnalysisRepository fraudAnalysisRepository;

  @Autowired
  private NotificationService notificationService;

  @Autowired
  private EmailService emailService;

  @Autowired
  private SmsService smsService;

  private final ObjectMapper objectMapper = new ObjectMapper();

  // Définition des règles de fraude
  private List<FraudRule> defineRules() {
    List<FraudRule> rules = new ArrayList<>();

    rules.add(new FraudRule("R1", "Late declaration (>7 days)", 30, false, null));
    rules.add(new FraudRule("R2", "Night accident (11pm-5am)", 25, false, null));
    rules.add(new FraudRule("R3", "Client with more than 3 claims", 40, false, null));
    rules.add(new FraudRule("R4", "Insufficient photos (<2 photos)", 20, false, null));
    rules.add(new FraudRule("R5", "Injuries reported without photos", 35, false, null));
    rules.add(new FraudRule("R6", "Driver under 20 years old", 30, false, null));
    rules.add(new FraudRule("R7", "Accident declared on weekend", 15, false, null));
    rules.add(new FraudRule("R8", "Same address for both drivers", 25, false, null));

    return rules;
  }


  //  Met à jour ou insère
  @Transactional
  public FraudAnalysis analyzeClaimWithAlert(Long claimId) {
    log.info(" Fraud analysis for claim ID: {}", claimId);

    // Vérifier si une analyse existe déjà
    FraudAnalysis existingAnalysis = fraudAnalysisRepository.findByClaimId(claimId);

    if (existingAnalysis != null) {
      log.info(" Existing analysis found, updating..");
      return updateExistingAnalysis(existingAnalysis, claimId);
    } else {
      log.info("Creating new analysis..");
      return createNewAnalysis(claimId);
    }
  }

  //  Créer une nouvelle analyse
  private FraudAnalysis createNewAnalysis(Long claimId) {
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new RuntimeException("claim not found " + claimId));

    // Calculer le score
    FraudScoreResult result = calculateFraudScore(claim);

    // Créer l'analyse
    FraudAnalysis analysis = new FraudAnalysis();
    analysis.setClaim(claim);
    analysis.setClaimReference(claim.getReference());
    analysis.setFraudScore(result.getScore());
    analysis.setRiskLevel(result.getRiskLevel());
    analysis.setRecommendation(result.getRecommendation());

    try {
      analysis.setTriggeredRules(objectMapper.writeValueAsString(result.getTriggeredRules()));
    } catch (JsonProcessingException e) {
      log.error("Error serializing rules: {}", e.getMessage());
    }

    FraudAnalysis savedAnalysis = fraudAnalysisRepository.save(analysis);
    log.info(" New analysis created - Score: {}, Risk: {}", result.getScore(), result.getRiskLevel());

    // Envoyer alertes
    sendFraudAlerts(savedAnalysis, claim);

    return savedAnalysis;
  }

  // Mettre à jour une analyse existante
  private FraudAnalysis updateExistingAnalysis(FraudAnalysis analysis, Long claimId) {
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new RuntimeException("Claim not found: " + claimId));

    // Recalculer le score
    FraudScoreResult result = calculateFraudScore(claim);

    // Mettre à jour les champs
    analysis.setFraudScore(result.getScore());
    analysis.setRiskLevel(result.getRiskLevel());
    analysis.setRecommendation(result.getRecommendation());
    analysis.setAnalysisDate(LocalDateTime.now()); // Met à jour la date

    try {
      analysis.setTriggeredRules(objectMapper.writeValueAsString(result.getTriggeredRules()));
    } catch (JsonProcessingException e) {
      log.error("Error serializing rules: {}", e.getMessage());
    }

    FraudAnalysis updatedAnalysis = fraudAnalysisRepository.save(analysis);
    log.info(" Analysis updated - Score: {}, Risk: {}", result.getScore(), result.getRiskLevel());

    // Envoyer alertes
    sendFraudAlerts(updatedAnalysis, claim);

    return updatedAnalysis;
  }

  //  Calcul du score de fraude
  private FraudScoreResult calculateFraudScore(Claim claim) {
    List<FraudRule> rules = defineRules();
    List<FraudRule> triggeredRules = new ArrayList<>();
    int totalScore = 0;

    // Règle R1: Délai de déclaration > 7 jours
    if (claim.getOpeningDate() != null && claim.getAccident() != null
      && claim.getAccident().getAccidentDate() != null) {

      long daysDelay = ChronoUnit.DAYS.between(
        claim.getAccident().getAccidentDate().atStartOfDay(),
        claim.getOpeningDate()
      );

      if (daysDelay > 7) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R1"))
          .findFirst()
          .orElse(new FraudRule("R1", "Late declaration (>7 days)", 30, false, null));

        rule.setTriggered(true);
        rule.setDetails(daysDelay + " days delay");
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }

    // Règle R2: Accident de nuit (23h-5h)
    if (claim.getAccident() != null && claim.getAccident().getTime() != null) {
      int hour = claim.getAccident().getTime().getHour();
      if (hour >= 23 || hour <= 5) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R2"))
          .findFirst()
          .orElse(new FraudRule("R2", "Night accident (11pm-5am)", 25, false, null));

        rule.setTriggered(true);
        rule.setDetails("Accident at " + hour + "h");
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }

    // Règle R3: Client avec plus de 3 sinistres
    if (claim.getClient() != null && claim.getClient().getId() != null) {
      Long clientId = claim.getClient().getId();
      long clientClaimsCount = claimRepository.countByClientId(clientId);

      if (clientClaimsCount > 3) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R3"))
          .findFirst()
          .orElse(new FraudRule("R3", "Client with more than 3 claims", 40, false, null));

        rule.setTriggered(true);
        rule.setDetails(clientClaimsCount + " claims for this client");
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }

    // Règle R4: Photos insuffisantes (< 2 photos)
    if (claim.getAccident() != null && claim.getAccident().getPhotos() != null) {
      int photoCount = claim.getAccident().getPhotos().size();
      if (photoCount < 2) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R4"))
          .findFirst()
          .orElse(new FraudRule("R4", "Insufficient photos (<2 photos)", 20, false, null));

        rule.setTriggered(true);
        rule.setDetails(photoCount + " photo(s) provided");
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }

    // Règle R5: Blessures signalées mais pas de photos
    if (claim.getAccident() != null &&
      claim.getAccident().getInjuries() != null &&
      claim.getAccident().getInjuries()) {

      int photoCount = claim.getAccident().getPhotos() != null ?
        claim.getAccident().getPhotos().size() : 0;

      if (photoCount < 2) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R5"))
          .findFirst()
          .orElse(new FraudRule("R5", "Injuries reported without photos", 35, false, null));

        rule.setTriggered(true);
        rule.setDetails("Injuries declared but only " + photoCount + " photo(s)");
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }

    // Règle R6: Conducteur de moins de 20 ans
    if (claim.getAccident() != null &&
      claim.getAccident().getDrivers() != null &&
      !claim.getAccident().getDrivers().isEmpty()) {

      // Trouver le conducteur principal (DRIVER_A)
      Driver mainDriver = claim.getAccident().getDrivers().stream()
        .filter(d -> d.getDriverType() == DriverType.DRIVER_A)
        .findFirst()
        .orElse(null);

      // Si pas de DRIVER_A, prendre le premier driver
      if (mainDriver == null && !claim.getAccident().getDrivers().isEmpty()) {
        mainDriver = claim.getAccident().getDrivers().get(0);
      }

      if (mainDriver != null &&
        mainDriver.getDateOfBirth() != null &&
        claim.getAccident().getAccidentDate() != null) {

        LocalDate birthDate = mainDriver.getDateOfBirth();
        LocalDate accidentDate = claim.getAccident().getAccidentDate();

        int age = Period.between(birthDate, accidentDate).getYears();

        if (age < 20) {
          FraudRule rule = rules.stream()
            .filter(r -> r.getCode().equals("R6"))
            .findFirst()
            .orElse(new FraudRule("R6", "Driver under 20 years old", 30, false, null));

          rule.setTriggered(true);
          rule.setDetails("Driver age: " + age + " years");
          triggeredRules.add(rule);
          totalScore += rule.getWeight();
        }
      }
    }

    // Règle R7: Accident déclaré un week-end
    if (claim.getAccident() != null && claim.getAccident().getAccidentDate() != null) {
      LocalDate accidentDate = claim.getAccident().getAccidentDate();
      DayOfWeek day = accidentDate.getDayOfWeek();

      if (day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R7"))
          .findFirst()
          .orElse(new FraudRule("R7", "Accident declared on weekend", 15, false, null));

        rule.setTriggered(true);
        rule.setDetails("Day: " + day.toString());
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }

    // Règle R8: Same address for both drivers (NOUVELLE RÈGLE)
    if (claim.getAccident() != null && claim.getAccident().getDrivers() != null &&
      claim.getAccident().getDrivers().size() >= 2) {
      Driver driver1 = claim.getAccident().getDrivers().get(0);
      Driver driver2 = claim.getAccident().getDrivers().get(1);

      if (driver1.getAddress() != null && driver2.getAddress() != null &&
        driver1.getAddress().equals(driver2.getAddress())) {
        FraudRule rule = rules.stream()
          .filter(r -> r.getCode().equals("R8"))
          .findFirst()
          .orElse(new FraudRule("R8", "Same address for both drivers", 25, false, null));

        rule.setTriggered(true);
        rule.setDetails("Both drivers share the same address: " + driver1.getAddress());
        triggeredRules.add(rule);
        totalScore += rule.getWeight();
      }
    }


    // Déterminer le niveau de risque
    RiskLevel riskLevel;
    String recommendation;

    if (totalScore >= 70) {
      riskLevel = RiskLevel.HIGH;
      recommendation = "🔴 DEEP INVESTIGATION REQUIRED";
    } else if (totalScore >= 40) {
      riskLevel = RiskLevel.MEDIUM;
      recommendation = "🟠 HUMAN VERIFICATION RECOMMENDED";
    } else {
      riskLevel = RiskLevel.LOW;
      recommendation = "🟢 AUTOMATIC PROCESSING - Low risk";
    }

    return new FraudScoreResult(totalScore, riskLevel, recommendation, triggeredRules);
  }


  //  Envoi des alertes
  @Autowired
  private EnhancedEmailService enhancedEmailService;

  private void sendFraudAlerts(FraudAnalysis analysis, Claim claim) {
    String to = "benabdeljalilbahija@gmail.com";
    String riskLevel = analysis.getRiskLevel().toString();
    String claimRef = claim.getReference();
    int score = analysis.getFraudScore();
    List<FraudRule> rules = parseTriggeredRules(analysis.getTriggeredRules());
    String region = claim.getRegion();

    // AJOUTEZ CES LOGS POUR VÉRIFIER
    System.out.println("=== ENVOI EMAIL FRAUDE ===");
    System.out.println("Destinataire: " + to);
    System.out.println("Règles déclenchées: " + rules.size());
    for (FraudRule rule : rules) {
      System.out.println("  - " + rule.getCode() + ": " + rule.getDescription());
    }

    enhancedEmailService.sendFraudAlertEmail(to, riskLevel, claimRef, score, rules, region);
  }


  // Classe interne pour le résultat
  private class FraudScoreResult {
    private int score;
    private RiskLevel riskLevel;
    private String recommendation;
    private List<FraudRule> triggeredRules;

    public FraudScoreResult(int score, RiskLevel riskLevel, String recommendation, List<FraudRule> triggeredRules) {
      this.score = score;
      this.riskLevel = riskLevel;
      this.recommendation = recommendation;
      this.triggeredRules = triggeredRules;
    }

    public int getScore() { return score; }
    public RiskLevel getRiskLevel() { return riskLevel; }
    public String getRecommendation() { return recommendation; }
    public List<FraudRule> getTriggeredRules() { return triggeredRules; }
  }

  private List<FraudRule> parseTriggeredRules(String triggeredRulesJson) {
    try {
      if (triggeredRulesJson == null || triggeredRulesJson.isEmpty() || triggeredRulesJson.equals("[]")) {
        return new ArrayList<>();
      }

      return objectMapper.readValue(triggeredRulesJson,
        new TypeReference<List<FraudRule>>() {});

    } catch (Exception e) {
      log.error("❌ Erreur parsing règles: {}", e.getMessage());
      return new ArrayList<>();
    }
  }

}
