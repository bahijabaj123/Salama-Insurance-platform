package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.Expert.ExpertiseStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface IExpertReportHassenService {

    ExpertReportHassen createReport(Integer expertId, ExpertReportHassen report);

    List<ExpertReportHassen> getAllReports();

    ExpertReportHassen getReportById(Integer id);

    List<ExpertReportHassen> getReportsByExpertId(Integer expertId);

    ExpertReportHassen updateReport(Integer id, ExpertReportHassen report);

    void deleteReport(Integer id);

    // ===== MÉTHODES AVANCÉES =====

    // Changer le statut d'un rapport
    ExpertReportHassen changerStatut(Integer id, ExpertiseStatus nouveauStatut);

    // Calcul automatique des totaux du rapport
    ExpertReportHassen calculerTotaux(Integer id);

    // Recherche par statut
    List<ExpertReportHassen> findByStatut(ExpertiseStatus statut);

    // Recherche par numéro de référence
    ExpertReportHassen findByNumeroReference(String numeroReference);

    // Recherche par période
    List<ExpertReportHassen> findByPeriode(LocalDate debut, LocalDate fin);

    // Recherche par immatriculation du véhicule
    List<ExpertReportHassen> findByImmatriculation(String immatriculation);

    // Recherche par compagnie d'assurance
    List<ExpertReportHassen> findByAssurance(String assurance);

    // Statistiques par expert
    Map<String, Object> getStatistiquesExpert(Integer expertId);

    // Statistiques globales
    Map<String, Object> getStatistiquesGlobales();
}
