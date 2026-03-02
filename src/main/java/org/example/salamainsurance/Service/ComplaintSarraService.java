package org.example.salamainsurance.Service;

import jakarta.annotation.PostConstruct;
import org.example.salamainsurance.Ai.DataLoader;
import org.example.salamainsurance.Ai.NaiveBayesClassifier;
import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Repository.ComplaintRepository;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ComplaintSarraService implements IComplaintSarraService {
    @Autowired
    private ComplaintRepository complaintRepository;
    private final NaiveBayesClassifier classifier = new NaiveBayesClassifier();
    @Autowired
    private IndemnityRepository indemnityRepository;
    @Override
    public ComplaintSarra createComplaint(ComplaintSarra complaint) {
        return complaintRepository.save(complaint);
    }
    public ComplaintSarra createAndLinkToIndemnity(ComplaintSarra complaint, Long indemnityId) {
        IndemnitySarra indemnity = indemnityRepository.findById(indemnityId)
                .orElseThrow(() -> new RuntimeException("Indemnité non trouvée avec l'ID : " + indemnityId));

        complaint.setIndemnity(indemnity);
        return complaintRepository.save(complaint);
    }
    @Override
    public List<ComplaintSarra> getAllComplaints() {
        return complaintRepository.findAll();
    }

    @Override
    public ComplaintSarra getComplaintById(Long id) {
        return complaintRepository.findById(id).orElse(null);
    }
    public ComplaintSarra updateComplaint(Long id, ComplaintSarra details) {
        return complaintRepository.findById(id).map(existing -> {
            existing.setTitle(details.getTitle());
            existing.setDescription(details.getDescription());
            existing.setStatus(details.getStatus());
            // On sauvegarde l'objet mis à jour
            return complaintRepository.save(existing);
        }).orElse(null);
    }
    @Override
    public void deleteComplaint(Long id) {
        complaintRepository.deleteById(id);
    }
<<<<<<< HEAD


}
=======
    @PostConstruct
    public void initAi() {
        try {
            DataLoader loader = new DataLoader();
            // Chemin vers ton fichier de données
            String csvPath = "src/main/resources/data/complaint_dataset.csv";

            List<String[]> trainingData = loader.loadClaims(csvPath);
            classifier.train(trainingData);

            System.out.println("🚀 IA Salama Insurance prête à l'emploi !");
        } catch (Exception e) {
            System.err.println("⚠️ Erreur lors de l'initialisation de l'IA : " + e.getMessage());
        }
    }

    /**
     * Reçoit une réclamation, l'analyse avec l'IA, et la sauvegarde.
     */
    public ComplaintSarra CreateComplaint(String description) {
        ComplaintSarra complaint = new ComplaintSarra();
        complaint.setDescription(description);


        String result = classifier.predict(description);
        complaint.setDetectedSentiment(result);

        return complaintRepository.save(complaint);
    }

}

>>>>>>> feature-complaint-sarra
