package org.example.salamainsurance.Repository.ExpertRepo;

import org.example.salamainsurance.Entity.ExpertManagement.Expert;
import org.example.salamainsurance.Entity.ExpertManagement.ExpertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpertRepository extends JpaRepository<Expert, Long> {

  //  CORRIGÉ : Utilise e.status au lieu de e.available
  @Query("SELECT e FROM Expert e WHERE e.region = :region AND e.status = 'AVAILABLE' ORDER BY " +
    "(e.performanceScore * 0.4 + " +
    "(100 - e.activeClaims * 10) * 0.3 + " +
    "CASE WHEN e.averageProcessingTime IS NULL THEN 50 ELSE (100 - e.averageProcessingTime) * 0.3 END) DESC")
  List<Expert> findBestExpertsForAssignment(@Param("region") String region);

  // Méthodes utilitaires
  List<Expert> findByStatus(ExpertStatus status);

  List<Expert> findByRegionAndStatus(String region, ExpertStatus status);

  // Trouver les experts disponibles avec leur charge de travail
  List<Expert> findByStatusAndCurrentWorkloadLessThan(ExpertStatus status, int maxWorkload);

  //  Compter les experts par statut
  long countByStatus(ExpertStatus status);

  //  Trouver les experts surchargés
  @Query("SELECT e FROM Expert e WHERE e.currentWorkload >= e.maxWorkload")
  List<Expert> findOverloadedExperts();

  List<Expert> findAvailableExpertsByRegion(String region);
}
