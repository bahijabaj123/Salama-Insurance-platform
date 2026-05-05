package org.example.salamainsurance.Service;

import org.example.salamainsurance.Ai.NaiveBayesClassifier;
import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.example.salamainsurance.Service.Report.AccidentServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class IndemnitySarraService {

  @Autowired
  private IndemnityRepository indemnityRepository;

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private AccidentServiceImpl accidentService;

  /**
   * Génère ou met à jour l'indemnité pour un sinistre donné.
   * Transactionnelle pour assurer la cohérence.
   */
  @Transactional
  public IndemnitySarra genererQuittanceOfficielle(Long claimId) {

    // 1. Récupération du sinistre
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new RuntimeException("Sinistre introuvable avec id: " + claimId));

    if (claim.getAccident() == null) {
      throw new RuntimeException("Aucun accident lié au sinistre id: " + claimId);
    }

    // 2. Calcul du pourcentage de responsabilité (conducteur A)
    int respA = 0;
    try {
      ResponsibilityResult respResult = accidentService.calculateResponsibility(claim.getAccident().getId());
      if (respResult != null) {
        // À adapter selon le nom réel de la méthode. Exemple : getDriverAResponsibility()
        respA = respResult.getDriverAResponsibility();
        if (respA < 0) respA = 0;
        if (respA > 100) respA = 100;
      }
    } catch (Exception e) {
      System.err.println("⚠️ Responsabilité non calculable, défaut 0% : " + e.getMessage());
    }

    // 3. Montant expert
    double montantExpert;
    try {
      ExpertReportHassen rapport = claim.getLatestExpertiseReport();
      if (rapport != null && rapport.getTotalNet() != null) {
        montantExpert = rapport.getTotalNet().doubleValue();
      } else {
        // Fallback : estimation basée sur urgencyScore (si présent)
        if (claim.getUrgencyScore() != null) {
          montantExpert = claim.getUrgencyScore() * 50.0;
        } else {
          montantExpert = 1000.0; // valeur par défaut
        }
        System.err.println("⚠️ Pas de rapport expert, montant estimé = " + montantExpert);
      }
    } catch (Exception e) {
      montantExpert = 1000.0;
      System.err.println("⚠️ Erreur lors de la récupération du rapport expert : " + e.getMessage());
    }

    // 4. Calculs indemnitaires
    double tauxResp = respA / 100.0;
    double baseCalcul = montantExpert * (1 - tauxResp);
    double franchise = (respA > 0) ? Math.max(150.0, montantExpert * 0.10) : 0.0;
    double netFinal = Math.max(0, baseCalcul - franchise);

    // 5. Création ou mise à jour de l'entité IndemnitySarra
    IndemnitySarra indemnity = indemnityRepository.findByClaimId(claimId)
      .orElse(new IndemnitySarra());

    indemnity.setClaimId(claimId);
    indemnity.setGrossAmount(montantExpert);
    indemnity.setResponsibility(respA);
    indemnity.setDeductibleValue(franchise);
    indemnity.setNetAmount(netFinal);
    indemnity.setCalculationDate(LocalDate.now());
    indemnity.setStatus(SettlementStatus.VALIDATED);

    return indemnityRepository.save(indemnity);
  }

  // --- Méthodes CRUD classiques ---

  public List<IndemnitySarra> getAll() {
    return indemnityRepository.findAll();
  }

  public Optional<IndemnitySarra> getById(Long id) {
    return indemnityRepository.findById(id);
  }

  /**
   * Récupère l'indemnité par l'identifiant du sinistre (claimId).
   * Important : la méthode findByClaimId doit exister dans IndemnityRepository.
   */
  public Optional<IndemnitySarra> findByClaimId(Long claimId) {
    return indemnityRepository.findByClaimId(claimId);
  }

  public void delete(Long id) {
    indemnityRepository.deleteById(id);
  }
}
