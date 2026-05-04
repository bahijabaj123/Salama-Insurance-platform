package org.example.salamainsurance.Service;

import org.example.salamainsurance.Ai.NaiveBayesClassifier;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class IndemnitySarraService implements IIndemnitySarraService {

  @Autowired
  private IndemnityRepository indemnityRepository;

  @Autowired
  private NaiveBayesClassifier classifier;

  /**
   * Méthode appelée par ton Controller pour le calcul immédiat et l'enregistrement
   */
  @Override
  public IndemnitySarra calculateAndSave(Double gross, Integer resp, Double fixedDed) {
    IndemnitySarra indemnity = new IndemnitySarra();

    // 1. Assignation des valeurs d'entrée
    indemnity.setGrossAmount(gross);
    indemnity.setResponsibility(resp);
    indemnity.setDeductibleValue(fixedDed);

    // 2. Logique de calcul :
    // Montant Net = [Montant Brut * (1 - Taux de Responsabilité)] - Franchise Fixe
    double respRate = resp / 100.0;
    double amountAfterResponsibility = gross * (1 - respRate);
    double finalNet = amountAfterResponsibility - fixedDed;

    // 3. Sécurité : On ne paie pas un montant négatif
    indemnity.setNetAmount(Math.max(0.0, finalNet));

    // 4. Initialisation des métadonnées
    indemnity.setCalculationDate(LocalDate.now());
    indemnity.setStatus(SettlementStatus.PENDING);

    // 5. Sauvegarde en base de données
    return indemnityRepository.save(indemnity);
  }

  /**
   * Calcul avancé (incluant la valeur vénale et contractuelle)
   */
  @Override
  public IndemnitySarra calculateAdvancedPayout(Long id, Double marketValueAtExpertise, Double insuredValueInContract) {
    IndemnitySarra indemnity = indemnityRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Dossier introuvable pour l'ID : " + id));

    double gross = (indemnity.getGrossAmount() != null) ? indemnity.getGrossAmount() : 0.0;
    double respRate = (indemnity.getResponsibility() != null) ? indemnity.getResponsibility() / 100.0 : 0.0;

    // Part couverte selon la responsabilité
    double coveredByInsurer = gross * (1 - respRate);

    // Application de la règle proportionnelle si sous-assurance
    double proportionalFactor = 1.0;
    if (marketValueAtExpertise != null && marketValueAtExpertise > insuredValueInContract) {
      proportionalFactor = insuredValueInContract / marketValueAtExpertise;
    }

    double afterProportional = coveredByInsurer * proportionalFactor;
    double deductible = (indemnity.getDeductibleValue() != null) ? indemnity.getDeductibleValue() : 0.0;

    double finalNet = Math.max(0.0, afterProportional - deductible);

    indemnity.setNetAmount(finalNet);
    indemnity.setStatus(SettlementStatus.VALIDATED);
    indemnity.setCalculationDate(LocalDate.now());

    return indemnityRepository.save(indemnity);
  }

  /**
   * Ta logique spécifique de Facture avec analyse de sentiment IA
   */
  public String genererFactureSeule(String texteSinistre, double montantDommage, double franchiseBase) {
    // 1. Analyse IA du sentiment du client
    String sentiment = classifier.predict(texteSinistre);
    boolean estNegatif = sentiment.equalsIgnoreCase("NÉGATIF");

    // 2. Calcul avec bonus commercial IA
    double remiseIA = estNegatif ? (franchiseBase * 0.20) : 0.0;
    double franchiseFinale = franchiseBase - remiseIA;
    double montantNetALiberer = montantDommage - franchiseFinale;

    // 3. Génération du texte de la facture
    StringBuilder sb = new StringBuilder();
    sb.append("===========================================\n");
    sb.append("        SALAMA INSURANCE - FACTURE IA      \n");
    sb.append("===========================================\n");
    sb.append("Analyse Sentiment : ").append(sentiment).append("\n");
    sb.append("Décision IA       : ").append(estNegatif ? "REMISE FIDÉLITÉ ACCORDÉE (20%)" : "AUCUNE REMISE").append("\n");
    sb.append("-------------------------------------------\n");
    sb.append(String.format("Montant brut des dommages  : %10.2f DT\n", montantDommage));
    sb.append(String.format("Franchise contractuelle    : %10.2f DT\n", franchiseBase));

    if (estNegatif) {
      sb.append(String.format("Remise geste commercial    : -%10.2f DT\n", remiseIA));
      sb.append(String.format("Franchise finale appliquée : %10.2f DT\n", franchiseFinale));
    }

    sb.append("-------------------------------------------\n");
    sb.append(String.format("MONTANT FINAL À LIBÉRER    : %10.2f DT\n", Math.max(0, montantNetALiberer)));
    sb.append("===========================================\n");
    sb.append("Validé par le département Indemnisation IA");

    return sb.toString();
  }

  @Override
  public IndemnitySarra saveInitialData(Double gross, Integer resp, Double deductible) {
    IndemnitySarra indemnity = new IndemnitySarra();
    indemnity.setGrossAmount(gross);
    indemnity.setResponsibility(resp);
    indemnity.setDeductibleValue(deductible);
    indemnity.setStatus(SettlementStatus.PENDING);
    return indemnityRepository.save(indemnity);
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
