package org.example.salamainsurance.Service.Expert;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.Entity.Expert.*;
import org.example.salamainsurance.Repository.Expert.DommageHassenRepository;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.example.salamainsurance.Repository.Expert.ExpertReportHassenRepository;
import org.example.salamainsurance.Repository.Expert.MainOeuvreHassenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpertReportHassenService implements IExpertReportHassenService {

    private final ExpertReportHassenRepository reportRepository;
    private final ExpertHassenRepository expertRepository;
    private final DommageHassenRepository dommageRepository;
    private final MainOeuvreHassenRepository mainOeuvreRepository;

    @Override
    public List<ExpertReportHassen> getReportsByExpertId(Integer expertId) {
        return reportRepository.findByExpert_IdExpert(expertId);
    }

    // CREATE
    @Override
    @Transactional
    public ExpertReportHassen createReport(Integer expertId, ExpertReportHassen report) {
        ExpertHassen expert = expertRepository.findById(expertId)
                .orElseThrow(() -> new RuntimeException("Expert non trouvé avec l'ID: " + expertId));
        report.setExpert(expert);

        // Associer les dommages au rapport
        if (report.getDommages() != null) {
            for (DommageHassen dommage : report.getDommages()) {
                dommage.setRapportExpertise(report);
            }
        }

        // Associer les mains d'œuvre au rapport
        if (report.getMainsOeuvre() != null) {
            for (MainOeuvreHassen mainOeuvre : report.getMainsOeuvre()) {
                mainOeuvre.setRapportExpertise(report);
            }
        }

        // Associer les pièces jointes au rapport
        if (report.getPiecesJointes() != null) {
            for (PieceJointeHassen pieceJointe : report.getPiecesJointes()) {
                pieceJointe.setRapportExpertise(report);
            }
        }

        return reportRepository.save(report);
    }

    // READ ALL
    @Override
    public List<ExpertReportHassen> getAllReports() {
        return reportRepository.findAll();
    }

    // READ BY ID
    @Override
    public ExpertReportHassen getReportById(Integer id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé avec l'ID: " + id));
    }

    // UPDATE
    @Override
    @Transactional
    public ExpertReportHassen updateReport(Integer id, ExpertReportHassen newReport) {
        ExpertReportHassen report = getReportById(id);

        report.setNumeroReference(newReport.getNumeroReference());
        report.setDateMission(newReport.getDateMission());
        report.setDateAccident(newReport.getDateAccident());
        report.setDateExamen(newReport.getDateExamen());
        report.setLieuExamen(newReport.getLieuExamen());
        report.setObservation(newReport.getObservation());
        report.setAssureNom(newReport.getAssureNom());
        report.setAssureContrat(newReport.getAssureContrat());
        report.setAssureDossier(newReport.getAssureDossier());
        report.setMandantAssurance(newReport.getMandantAssurance());
        report.setMandantAgence(newReport.getMandantAgence());
        report.setTiersNom(newReport.getTiersNom());
        report.setTiersContrat(newReport.getTiersContrat());
        report.setTiersAssurance(newReport.getTiersAssurance());
        report.setTiersImmatriculation(newReport.getTiersImmatriculation());
        report.setVehiculeMarque(newReport.getVehiculeMarque());
        report.setVehiculeType(newReport.getVehiculeType());
        report.setVehiculeImmatriculation(newReport.getVehiculeImmatriculation());
        report.setVehiculeGenre(newReport.getVehiculeGenre());
        report.setVehiculeCouleur(newReport.getVehiculeCouleur());
        report.setVehiculePuissance(newReport.getVehiculePuissance());
        report.setVehiculeEnergie(newReport.getVehiculeEnergie());
        report.setVehiculeEtat(newReport.getVehiculeEtat());
        report.setVehiculeNumeroSerie(newReport.getVehiculeNumeroSerie());
        report.setVehiculeDateMiseCirculation(newReport.getVehiculeDateMiseCirculation());
        report.setVehiculeIndexKm(newReport.getVehiculeIndexKm());
        report.setTotalFournituresHT(newReport.getTotalFournituresHT());
        report.setTvaFournitures(newReport.getTvaFournitures());
        report.setTotalFournituresTTC(newReport.getTotalFournituresTTC());
        report.setTotalMainOeuvreHT(newReport.getTotalMainOeuvreHT());
        report.setTotalMainOeuvreTTC(newReport.getTotalMainOeuvreTTC());
        report.setTotalGeneral(newReport.getTotalGeneral());
        report.setRemise(newReport.getRemise());
        report.setVetuste(newReport.getVetuste());
        report.setTotalNet(newReport.getTotalNet());
        report.setNatureDegats(newReport.getNatureDegats());
        report.setConclusions(newReport.getConclusions());
      report.setStatutRapport(newReport.getStatutRapport());

        return reportRepository.save(report);
    }

    // DELETE
    @Override
    public void deleteReport(Integer id) {
        if (!reportRepository.existsById(id)) {
            throw new RuntimeException("Rapport non trouvé avec l'ID: " + id);
        }
        reportRepository.deleteById(id);
    }

  @Override
  @Transactional
  public ExpertReportHassen changerStatut(Integer id, ExpertiseStatus nouveauStatut) {
    ExpertReportHassen report = getReportById(id);
    report.setStatutRapport(nouveauStatut);
    return reportRepository.save(report);
  }


    @Override
    @Transactional
    public ExpertReportHassen calculerTotaux(Integer id) {
        ExpertReportHassen report = getReportById(id);
        BigDecimal TVA_RATE = new BigDecimal("0.19");

        // Calcul fournitures HT
        BigDecimal totalFournituresHT = dommageRepository.sumMontantByRapportId(id);
        if (totalFournituresHT == null) totalFournituresHT = BigDecimal.ZERO;

        BigDecimal tvaFournitures = totalFournituresHT.multiply(TVA_RATE).setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalFournituresTTC = totalFournituresHT.add(tvaFournitures);

        // Calcul main d'œuvre HT
        BigDecimal totalMainOeuvreHT = mainOeuvreRepository.sumMontantByRapportId(id);
        if (totalMainOeuvreHT == null) totalMainOeuvreHT = BigDecimal.ZERO;
        BigDecimal tvaMainOeuvre = totalMainOeuvreHT.multiply(TVA_RATE).setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalMainOeuvreTTC = totalMainOeuvreHT.add(tvaMainOeuvre);

        // Total général
        BigDecimal totalGeneral = totalFournituresTTC.add(totalMainOeuvreTTC);

        // Total net (après vétusté et remise)
        BigDecimal vetuste = report.getVetuste() != null ? report.getVetuste() : BigDecimal.ZERO;
        BigDecimal remise = report.getRemise() != null ? report.getRemise() : BigDecimal.ZERO;
        BigDecimal totalNet = totalGeneral.subtract(vetuste).subtract(remise);

        report.setTotalFournituresHT(totalFournituresHT);
        report.setTvaFournitures(tvaFournitures);
        report.setTotalFournituresTTC(totalFournituresTTC);
        report.setTotalMainOeuvreHT(totalMainOeuvreHT);
        report.setTotalMainOeuvreTTC(totalMainOeuvreTTC);
        report.setTotalGeneral(totalGeneral);
        report.setTotalNet(totalNet);

        return reportRepository.save(report);
    }

    // SEARCH BY STATUS
    @Override
    public List<ExpertReportHassen> findByStatut(ExpertiseStatus statut) {
        return reportRepository.findByStatutRapport(statut);
    }

    // SEARCH BY REFERENCE
    @Override
    public ExpertReportHassen findByNumeroReference(String numeroReference) {
        return reportRepository.findByNumeroReference(numeroReference)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé avec la référence: " + numeroReference));
    }

    @Override
    public List<ExpertReportHassen> findByPeriode(LocalDate debut, LocalDate fin) {
        return reportRepository.findByDateMissionBetween(debut, fin);
    }

    @Override
    public List<ExpertReportHassen> findByImmatriculation(String immatriculation) {
        return reportRepository.findByVehiculeImmatriculation(immatriculation);
    }

    @Override
    public List<ExpertReportHassen> findByAssurance(String assurance) {
        return reportRepository.findByMandantAssuranceContainingIgnoreCase(assurance);
    }

    @Override
    public Map<String, Object> getStatistiquesExpert(Integer expertId) {
        List<ExpertReportHassen> rapports = getReportsByExpertId(expertId);
        BigDecimal totalNet = rapports.stream()
                .filter(r -> r.getTotalNet() != null)
                .map(ExpertReportHassen::getTotalNet)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long enCours = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.EN_COURS).count();
        long termines = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.TERMINE).count();
        long valides = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.VALIDE).count();
        long annules = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.ANNULE).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("expertId", expertId);
        stats.put("totalRapports", rapports.size());
        stats.put("rapportsEnCours", enCours);
        stats.put("rapportsTermines", termines);
        stats.put("rapportsValides", valides);
        stats.put("rapportsAnnules", annules);
        stats.put("totalNetGlobal", totalNet);
        return stats;
    }

    @Override
    public Map<String, Object> getStatistiquesGlobales() {
        List<ExpertReportHassen> rapports = getAllReports();
        BigDecimal totalNet = rapports.stream()
                .filter(r -> r.getTotalNet() != null)
                .map(ExpertReportHassen::getTotalNet)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long enCours = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.EN_COURS).count();
        long termines = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.TERMINE).count();
        long valides = rapports.stream().filter(r -> r.getStatutRapport() ==  ExpertiseStatus.VALIDE).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRapports", rapports.size());
        stats.put("rapportsEnCours", enCours);
        stats.put("rapportsTermines", termines);
        stats.put("rapportsValides", valides);
        stats.put("totalNetGlobal", totalNet);
        return stats;
    }
}
