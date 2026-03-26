package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;

import java.util.List;
import java.util.Map;

public interface IExpertHassenService {

    ExpertHassen createExpert(ExpertHassen expert);

    List<ExpertHassen> getAllExperts();

    ExpertHassen getExpertById(Integer id);

    ExpertHassen updateExpert(Integer id, ExpertHassen expert);

    void deleteExpert(Integer id);

    List<ExpertHassen> findByInterventionZone(ExpertHassen.InterventionZone zone);

    // ===== MÉTHODES AVANCÉES =====

  List<ExpertHassen> findByStatus(ExpertStatus status);

  // Recherche par spécialité
    List<ExpertHassen> findBySpecialty(String specialty);

    // Recherche par nom ou prénom
    List<ExpertHassen> searchByName(String nom);

    // Experts avec X années min d'expérience
    List<ExpertHassen> findByExperienceMin(Integer minYears);

    // Activer / Désactiver un expert
  ExpertHassen changeStatus(Integer id, ExpertStatus nouveauStatut);

  // Statistiques globales des experts
    Map<String, Object> getExpertStatistics();
}
