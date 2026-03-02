package org.example.salamainsurance.Service;

import org.example.salamainsurance.Ai.NaiveBayesClassifier;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IndemnitySarraService implements IIndemnitySarraService {
    @Autowired
    private IndemnityRepository indemnityRepository;
@Autowired
    private NaiveBayesClassifier classifier;
    @Override
    public IndemnitySarra calculateAdvancedPayout(Long id, Double marketValueAtExpertise, Double insuredValueInContract) {

        IndemnitySarra indemnity = indemnityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim record not found for ID: " + id));


        double gross = (indemnity.getGrossAmount() != null) ? indemnity.getGrossAmount() : 0.0;


        double respRate = (indemnity.getResponsibility() != null) ? indemnity.getResponsibility() / 100.0 : 0.0;
        double coveredByInsurer = gross * (1 - respRate);


        double proportionalFactor = 1.0;
        if (marketValueAtExpertise != null && marketValueAtExpertise > insuredValueInContract) {
            proportionalFactor = insuredValueInContract / marketValueAtExpertise;
        }
        double afterProportional = coveredByInsurer * proportionalFactor;


        double deductible = (indemnity.getDeductibleValue() != null) ? indemnity.getDeductibleValue() : 0.0;
        double finalNet = Math.max(0.0, afterProportional - deductible);


        indemnity.setNetAmount(finalNet);
        indemnity.setStatus(SettlementStatus.VALIDATED); // Move from PENDING to VALIDATED
        indemnity.setCalculationDate(LocalDate.now());

        return indemnityRepository.save(indemnity);
    }
    @Override
    public IndemnitySarra saveInitialData(Double gross, Integer resp, Double deductible) {
        IndemnitySarra indemnity = new IndemnitySarra();
        indemnity.setGrossAmount(gross);
        indemnity.setResponsibility(resp);
        indemnity.setDeductibleValue(deductible);
        return indemnityRepository.save(indemnity);
    }

    public String genererFactureSeule(String texteSinistre, double montantDommage, double franchiseBase) {
        // 1. Analyse IA
        String sentiment = classifier.predict(texteSinistre);
        boolean estNegatif = sentiment.equalsIgnoreCase("NÉGATIF");

        // 2. Calculs précis
        double remiseIA = estNegatif ? (franchiseBase * 0.20) : 0.0;
        double franchiseFinale = franchiseBase - remiseIA;
        double montantNetALiberer = montantDommage - franchiseFinale;

        // 3. Construction du document pour le responsable
        StringBuilder sb = new StringBuilder();
        sb.append("===========================================\n");
        sb.append("        SALAMA INSURANCE - FACTURE IA      \n");
        sb.append("===========================================\n");
        sb.append("Analyse Sentiment : ").append(sentiment).append("\n");
        sb.append("Décision IA       : ").append(estNegatif ? "REMISE ACCORDÉE (20%)" : "AUCUNE REMISE").append("\n");
        sb.append("-------------------------------------------\n");
        sb.append(String.format("Montant brut des dommages  : %10.2f DT\n", montantDommage));
        sb.append(String.format("Franchise contractuelle    : %10.2f DT\n", franchiseBase));

        if (estNegatif) {
            sb.append(String.format("Remise exceptionnelle IA   : -%10.2f DT\n", remiseIA));
            sb.append(String.format("Franchise finale appliquée : %10.2f DT\n", franchiseFinale));
        }

        sb.append("-------------------------------------------\n");
        sb.append(String.format("MONTANT FINAL À PAYER      : %10.2f DT\n", montantNetALiberer));
        sb.append("===========================================\n");
        sb.append("Validé par le département Indemnisation IA");

        return sb.toString();
    }
    public List<IndemnitySarra> getAll() {
        return indemnityRepository.findAll();
    }

    public Optional<IndemnitySarra> getById(Long id) {
        return indemnityRepository.findById(id);
    }
@Override
    public void delete(Long id) {
        indemnityRepository.deleteById(id);
    }
}