package org.example.salamainsurance.Service;

import jakarta.annotation.PostConstruct;
import org.example.salamainsurance.Ai.DataLoader;
import org.example.salamainsurance.Ai.NaiveBayesClassifier;
import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ComplaintSarraService {

  @Autowired
  private ComplaintRepository complaintRepository;

  @Autowired
  private NaiveBayesClassifier classifier;

  @PostConstruct
  public void initAi() {
    try {
      DataLoader loader = new DataLoader();
      String csvPath = "src/main/resources/data/complaint_dataset.csv";
      List<String[]> trainingData = loader.loadClaims(csvPath);
      classifier.train(trainingData);
      System.out.println(" IA Salama Insurance opérationnelle !");
    } catch (Exception e) {
      System.err.println(" Erreur initialisation IA : " + e.getMessage());
    }
  }

  // Création simple avec analyse IA
  public ComplaintSarra createComplaint(String description) {
    ComplaintSarra complaint = new ComplaintSarra();
    complaint.setDescription(description);

    String result = classifier.predict(description);
    complaint.setDetectedSentiment(result);
    complaint.setPriority("NÉGATIF".equalsIgnoreCase(result) ? "HAUTE" : "NORMALE");

    return complaintRepository.save(complaint);
  }

  // GET BY ID
  public ComplaintSarra getComplaintById(Long id) {
    return complaintRepository.findById(id).orElse(null);
  }

  // UPDATE
  public ComplaintSarra updateComplaint(Long id, ComplaintSarra details) {
    return complaintRepository.findById(id).map(c -> {
      c.setDescription(details.getDescription());
      // On peut re-analyser si la description change
      String result = classifier.predict(details.getDescription());
      c.setDetectedSentiment(result);
      return complaintRepository.save(c);
    }).orElse(null);
  }

  // DELETE
  public void deleteComplaint(Long id) {
    complaintRepository.deleteById(id);
  }

  public List<ComplaintSarra> getAllComplaints() {
    return complaintRepository.findAll();
  }
}
