package org.example.salamainsurance.Service;

import jakarta.annotation.PostConstruct;
import org.example.salamainsurance.Ai.DataLoader;
import org.example.salamainsurance.Ai.NaiveBayesClassifier;
import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Entity.ComplaintStatus;
import org.example.salamainsurance.Repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ComplaintSarraService {

  @Autowired
  private ComplaintRepository complaintRepository;
  private Long lastNotificationTimestamp = System.currentTimeMillis();

  @Autowired
  private NaiveBayesClassifier classifier;

  @Autowired
  private ProfanityFilterService profanityFilterService;

  @PostConstruct
  public void initAi() {
    try {
      DataLoader loader = new DataLoader();
      String csvPath = "src/main/resources/data/complaint_dataset.csv";
      List<String[]> trainingData = loader.loadClaims(csvPath);
      classifier.train(trainingData);
      System.out.println("✅ IA Salama Insurance opérationnelle !");
    } catch (Exception e) {
      System.err.println("❌ Erreur initialisation IA : " + e.getMessage());
    }
  }
  public Map<String, Object> checkNewComplaints(Long lastChecked) {
    Map<String, Object> result = new HashMap<>();

    LocalDateTime lastCheckDate = LocalDateTime.ofInstant(Instant.ofEpochMilli(lastChecked), ZoneId.systemDefault());

    // Compter les nouvelles réclamations depuis la dernière vérification
    long newCount = complaintRepository.findAll().stream()
      .filter(c -> c.getCreatedAt().isAfter(lastCheckDate))
      .count();

    // Récupérer les dernières réclamations
    List<ComplaintSarra> newComplaints = complaintRepository.findAll().stream()
      .filter(c -> c.getCreatedAt().isAfter(lastCheckDate))
      .limit(5)
      .collect(Collectors.toList());

    result.put("hasNew", newCount > 0);
    result.put("count", newCount);
    result.put("complaints", newComplaints);

    return result;
  }
  // Prédiction simple (gardée pour compatibilité)
  public String predictOnly(String text) {
    return classifier.predict(text);
  }

  public ComplaintSarra respondToComplaint(Long id, String response, String respondedBy) {
    ComplaintSarra complaint = getComplaintById(id);
    if (complaint != null) {
      complaint.setResponse(response);
      complaint.setResponseDate(LocalDateTime.now());
      complaint.setRespondedBy(respondedBy != null ? respondedBy : "Assureur");
      complaint.setStatus(ComplaintStatus.RESOLVED);
      return complaintRepository.save(complaint);
    }
    return null;
  }

  public ComplaintSarra resolveComplaint(Long id) {
    ComplaintSarra complaint = getComplaintById(id);
    if (complaint != null) {
      complaint.setStatus(ComplaintStatus.RESOLVED);
      complaint.setResponseDate(LocalDateTime.now());
      return complaintRepository.save(complaint);
    }
    return null;
  }

  public Map<String, Object> getDashboardStats() {
    List<ComplaintSarra> all = getAllComplaints();

    Map<String, Object> stats = new HashMap<>();

    // Statistiques de base
    stats.put("total", all.size());
    stats.put("pending", all.stream().filter(c -> c.getStatus() == ComplaintStatus.PENDING).count());
    stats.put("resolved", all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count());
    stats.put("highPriority", all.stream().filter(c -> "HIGH".equals(c.getPriority())).count());
    stats.put("rejected", all.stream().filter(c -> c.getStatus() == ComplaintStatus.REJECTED).count());

    // Distribution des sentiments
    Map<String, Long> sentimentDist = new HashMap<>();
    sentimentDist.put("POSITIVE", all.stream().filter(c -> "POSITIVE".equals(c.getDetectedSentiment())).count());
    sentimentDist.put("NEUTRAL", all.stream().filter(c -> "NEUTRAL".equals(c.getDetectedSentiment())).count());
    sentimentDist.put("NEGATIVE", all.stream().filter(c -> "NEGATIVE".equals(c.getDetectedSentiment())).count());
    stats.put("sentimentDistribution", sentimentDist);

    // Évolution par jour (7 derniers jours)
    Map<String, Long> evolution = new LinkedHashMap<>();
    for (int i = 6; i >= 0; i--) {
      LocalDateTime date = LocalDateTime.now().minusDays(i);
      String key = date.format(DateTimeFormatter.ofPattern("dd/MM"));
      long count = all.stream().filter(c ->
        c.getCreatedAt().toLocalDate().equals(date.toLocalDate())
      ).count();
      evolution.put(key, count);
    }
    stats.put("evolutionByDay", evolution);

    // Temps moyen de traitement
    double avgTime = all.stream()
      .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED && c.getResponseDate() != null)
      .mapToDouble(c -> Duration.between(c.getCreatedAt(), c.getResponseDate()).toHours())
      .average()
      .orElse(0);
    stats.put("averageProcessingTime", Math.round(avgTime * 10) / 10.0);

    return stats;
  }

  public List<ComplaintSarra> getPendingComplaints() {
    return complaintRepository.findAll().stream()
      .filter(c -> c.getStatus() == ComplaintStatus.PENDING)
      .collect(Collectors.toList());
  }

  public List<ComplaintSarra> getResolvedComplaints() {
    return complaintRepository.findAll().stream()
      .filter(c -> c.getStatus() == ComplaintStatus.RESOLVED)
      .collect(Collectors.toList());
  }

  // Méthode pour formater le sentiment correctement
  private String formatSentiment(String rawSentiment) {
    if (rawSentiment == null) return "NEUTRAL";

    String upper = rawSentiment.toUpperCase();
    if (upper.contains("NEG") || upper.contains("NEGATIF")) return "NEGATIVE";
    if (upper.contains("POS") || upper.contains("POSITIF")) return "POSITIVE";
    if (upper.contains("NEUTRAL")) return "NEUTRAL";
    return "NEUTRAL";
  }

  // ✅ Création d'une réclamation avec analyse IA, priorité automatique et détection des gros mots
  public ComplaintSarra createComplaint(String description, Long claimId) {
    ComplaintSarra complaint = new ComplaintSarra();
    complaint.setDescription(description);
    complaint.setCreatedAt(LocalDateTime.now());
    complaint.setStatus(ComplaintStatus.PENDING);
    complaint.setClaimId(claimId);

    // ✅ VÉRIFICATION DES GROS MOTS - BLOQUAGE
    boolean hasProfanity = profanityFilterService.containsProfanity(description);

    if (hasProfanity) {
      // La réclamation est immédiatement rejetée
      complaint.setStatus(ComplaintStatus.REJECTED);
      complaint.setPriority("LOW");
      complaint.setDetectedSentiment("NEUTRAL");
      complaint.setTitle("[REJETÉE] Contient des mots inappropriés");
      complaint.setResponse("⚠️ Votre réclamation a été automatiquement rejetée car elle contient des mots inappropriés. Veuillez reformuler votre demande dans le respect de nos conditions d'utilisation.");
      complaint.setResponseDate(LocalDateTime.now());
      complaint.setRespondedBy("SYSTÈME");
      complaint.setHasProfanity(true);

      System.out.println("🔴 Réclamation bloquée - contient des gros mots: " + description);

      return complaintRepository.save(complaint);
    }

    // Si pas de gros mots, traitement normal
    complaint.setStatus(ComplaintStatus.PENDING);
    complaint.setHasProfanity(false);

    // Analyser le sentiment avec l'IA
    String rawSentiment = classifier.predict(description);
    String formattedSentiment = formatSentiment(rawSentiment);
    complaint.setDetectedSentiment(formattedSentiment);

    // ✅ Priorité automatique : NEGATIVE → HIGH, NEUTRAL → MEDIUM, POSITIVE → LOW
    if ("NEGATIVE".equals(formattedSentiment)) {
      complaint.setPriority("HIGH");
    } else if ("POSITIVE".equals(formattedSentiment)) {
      complaint.setPriority("LOW");
    } else {
      complaint.setPriority("MEDIUM");
    }

    // Extraire un titre automatiquement
    String title = description.length() > 50 ? description.substring(0, 50) + "..." : description;
    complaint.setTitle(title);

    return complaintRepository.save(complaint);
  }
  public List<ComplaintSarra> getByClaimId(Long claimId) {
    return complaintRepository.findAll().stream()
      .filter(c -> c.getClaimId() != null && c.getClaimId().equals(claimId))
      .collect(Collectors.toList());
  }
  // GET BY ID
  public ComplaintSarra getComplaintById(Long id) {
    return complaintRepository.findById(id).orElse(null);
  }
  public void bulkDelete(List<Long> ids) {
    if (ids == null || ids.isEmpty()) return;
    complaintRepository.deleteAllById(ids);
  }
  // UPDATE avec réanalyse du sentiment
  public ComplaintSarra updateComplaint(Long id, ComplaintSarra details) {
    return complaintRepository.findById(id).map(c -> {
      if (details.getTitle() != null) c.setTitle(details.getTitle());
      if (details.getDescription() != null) {
        c.setDescription(details.getDescription());
        // Ré-analyser si la description change
        String rawSentiment = classifier.predict(details.getDescription());
        String formattedSentiment = formatSentiment(rawSentiment);
        c.setDetectedSentiment(formattedSentiment);
        // Mettre à jour la priorité automatiquement
        if ("NEGATIVE".equals(formattedSentiment)) {
          c.setPriority("HIGH");
        } else if ("POSITIVE".equals(formattedSentiment)) {
          c.setPriority("LOW");
        } else {
          c.setPriority("MEDIUM");
        }
      }
      if (details.getPriority() != null) c.setPriority(details.getPriority());
      if (details.getStatus() != null) c.setStatus(details.getStatus());
      return complaintRepository.save(c);
    }).orElse(null);
  }

  // UPDATE status uniquement
  public ComplaintSarra updateStatus(Long id, String status) {
    return complaintRepository.findById(id).map(c -> {
      try {
        c.setStatus(ComplaintStatus.valueOf(status));
        return complaintRepository.save(c);
      } catch (IllegalArgumentException e) {
        return null;
      }
    }).orElse(null);
  }

  // DELETE
  public void deleteComplaint(Long id) {
    complaintRepository.deleteById(id);
  }

  // GET ALL
  public List<ComplaintSarra> getAllComplaints() {
    return complaintRepository.findAll();
  }

  // GET by priority
  public List<ComplaintSarra> getComplaintsByPriority(String priority) {
    return complaintRepository.findAll().stream()
      .filter(c -> priority.equalsIgnoreCase(c.getPriority()))
      .collect(Collectors.toList());
  }

  // GET by sentiment
  public List<ComplaintSarra> getComplaintsBySentiment(String sentiment) {
    return complaintRepository.findAll().stream()
      .filter(c -> sentiment.equalsIgnoreCase(c.getDetectedSentiment()))
      .collect(Collectors.toList());
  }

  // Statistiques
  public Map<String, Object> getStatistics() {
    List<ComplaintSarra> all = getAllComplaints();

    Map<String, Object> stats = new HashMap<>();
    stats.put("total", all.size());
    stats.put("pending", all.stream().filter(c -> c.getStatus() == ComplaintStatus.PENDING).count());
    stats.put("inProgress", all.stream().filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS).count());
    stats.put("resolved", all.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count());
    stats.put("highPriority", all.stream().filter(c -> "HIGH".equals(c.getPriority())).count());
    stats.put("negativeSentiment", all.stream().filter(c -> "NEGATIVE".equals(c.getDetectedSentiment())).count());
    stats.put("blocked", all.stream().filter(c -> c.getHasProfanity() != null && c.getHasProfanity()).count());

    return stats;
  }
}
