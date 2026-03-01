package org.example.salamainsurance.Controller.Fraud;

import org.example.salamainsurance.DTO.FraudAnalysisDTO;
import org.example.salamainsurance.Entity.Fraud.FraudAnalysis;
import org.example.salamainsurance.Entity.Fraud.RiskLevel;
import org.example.salamainsurance.Repository.Fraud.FraudAnalysisRepository;
import org.example.salamainsurance.Service.Fraud.FraudDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fraud")
public class FraudController {

  @Autowired
  private FraudDetectionService fraudDetectionService;

  @Autowired
  private FraudAnalysisRepository fraudAnalysisRepository;

  @PostMapping("/analyze/{claimId}")
  public ResponseEntity<?> analyzeClaim(@PathVariable Long claimId) {
    try {
      FraudAnalysis analysis = fraudDetectionService.analyzeClaimWithAlert(claimId);
      return ResponseEntity.ok(analysis);
    } catch (Exception e) {
      Map<String, String> error = new HashMap<>();
      error.put("error", e.getMessage());
      return ResponseEntity.badRequest().body(error);
    }
  }

  @GetMapping("/analysis/{id}")
  public ResponseEntity<?> getAnalysis(@PathVariable Long id) {
    return fraudAnalysisRepository.findById(id)
      .map(analysis -> {
        FraudAnalysisDTO dto = new FraudAnalysisDTO();
        dto.setId(analysis.getId());
        dto.setClaimId(analysis.getClaim().getId());
        dto.setClaimReference(analysis.getClaim().getReference());
        dto.setAnalysisDate(analysis.getAnalysisDate());
        dto.setFraudScore(analysis.getFraudScore());
        dto.setRiskLevel(analysis.getRiskLevel());
        dto.setTriggeredRules(analysis.getTriggeredRules());
        dto.setRecommendation(analysis.getRecommendation());
        return ResponseEntity.ok(dto);
      })
      .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/analyses")
  public ResponseEntity<List<FraudAnalysis>> getAllAnalyses() {
    return ResponseEntity.ok(fraudAnalysisRepository.findAll());
  }

  @GetMapping("/risk/{level}")
  public ResponseEntity<List<FraudAnalysis>> getByRiskLevel(@PathVariable RiskLevel level) {
    return ResponseEntity.ok(fraudAnalysisRepository.findByRiskLevel(level));
  }

  @GetMapping("/analyses/date-range")
  public ResponseEntity<List<FraudAnalysis>> getByDateRange(
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
    return ResponseEntity.ok(fraudAnalysisRepository.findByAnalysisDateBetween(start, end));
  }
  //DASHBOARD - STATISTIC
  @GetMapping("/dashboard")
  public ResponseEntity<Map<String, Object>> getDashboard() {
    Map<String, Object> dashboard = new HashMap<>();

    // Statistiques générales
    long totalAnalyses = fraudAnalysisRepository.count();
    dashboard.put("totalAnalyses", totalAnalyses);

    // Répartition par niveau de risque
    dashboard.put("highRisk", fraudAnalysisRepository.countByRiskLevel(RiskLevel.HIGH));
    dashboard.put("mediumRisk", fraudAnalysisRepository.countByRiskLevel(RiskLevel.MEDIUM));
    dashboard.put("lowRisk", fraudAnalysisRepository.countByRiskLevel(RiskLevel.LOW));

    // Score moyen
    Double avgScore = fraudAnalysisRepository.averageFraudScore();
    dashboard.put("averageScore", avgScore != null ? Math.round(avgScore * 10) / 10.0 : 0);

    // Dernières analyses (top 5)
    List<FraudAnalysis> latestAnalyses = fraudAnalysisRepository.findTop5ByOrderByAnalysisDateDesc();
    List<Map<String, Object>> latestList = new ArrayList<>();

    for (FraudAnalysis analysis : latestAnalyses) {
      Map<String, Object> item = new HashMap<>();
      item.put("id", analysis.getId());
      item.put("claimId", analysis.getClaim().getId());
      item.put("claimReference", analysis.getClaim().getReference());
      item.put("fraudScore", analysis.getFraudScore());
      item.put("riskLevel", analysis.getRiskLevel());
      item.put("analysisDate", analysis.getAnalysisDate());
      latestList.add(item);
    }
    dashboard.put("latestAnalyses", latestList);

    // Sinistres à haut risque (score > 60)
    List<FraudAnalysis> highRiskAnalyses = fraudAnalysisRepository.findByRiskLevel(RiskLevel.HIGH);
    dashboard.put("highRiskCount", highRiskAnalyses.size());

    // Répartition des règles les plus déclenchées
    Map<String, Integer> topRules = getTopTriggeredRules();
    dashboard.put("topRules", topRules);

    return ResponseEntity.ok(dashboard);
  }

  private Map<String, Integer> getTopTriggeredRules() {
    Map<String, Integer> ruleCount = new HashMap<>();
    ruleCount.put("Déclaration tardive", 3);
    ruleCount.put("Accident de nuit", 2);
    ruleCount.put("Montant élevé", 1);
    ruleCount.put("Témoin absent", 2);
    ruleCount.put("Historique client", 1);
    return ruleCount;
  }

  // ✅ NOUVEAU - Endpoint de test simple
  @GetMapping("/test-simple/{id}")
  public ResponseEntity<String> testSimple(@PathVariable Long id) {
    try {
      return fraudAnalysisRepository.findById(id)
        .map(analysis -> ResponseEntity.ok("Score: " + analysis.getFraudScore()))
        .orElse(ResponseEntity.notFound().build());
    } catch (Exception e) {
      return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
    }
  }

  // notifications
  // Dans FraudController.java

  @PostMapping("/analyze-with-alert/{claimId}")
  public ResponseEntity<?> analyzeWithAlert(@PathVariable Long claimId) {
    try {
      FraudAnalysis analysis = fraudDetectionService.analyzeClaimWithAlert(claimId);

      Map<String, Object> response = new HashMap<>();
      response.put("analysis", analysis);
      response.put("alertSent", true);
      response.put("message", "Analyse terminée avec alertes envoyées");

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      Map<String, String> error = new HashMap<>();
      error.put("error", e.getMessage());
      return ResponseEntity.badRequest().body(error);
    }
  }

  @GetMapping("/alerts/config")
  public ResponseEntity<Map<String, Object>> getAlertConfig() {
    Map<String, Object> config = new HashMap<>();

    config.put("highRisk", Map.of(
      "email", "manager@salama.ma",
      "sms", true,
      "action", "BLOCK_CLAIM"
    ));

    config.put("mediumRisk", Map.of(
      "email", "supervisor@salama.ma",
      "sms", false,
      "action", "REVIEW_REQUIRED"
    ));

    config.put("lowRisk", Map.of(
      "email", false,
      "sms", false,
      "action", "AUTO_PROCESS"
    ));

    return ResponseEntity.ok(config);
  }

}
