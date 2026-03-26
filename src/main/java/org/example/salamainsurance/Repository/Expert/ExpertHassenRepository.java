package org.example.salamainsurance.Repository.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;


import java.util.List;

@Repository
public interface ExpertHassenRepository extends JpaRepository<ExpertHassen, Integer> {

    List<ExpertHassen> findByInterventionZone(ExpertHassen.InterventionZone zone);

   List<ExpertHassen> findByStatus(ExpertStatus status);

    List<ExpertHassen> findByCity(String city);

    // Recherche par spécialité
    List<ExpertHassen> findBySpecialtyContainingIgnoreCase(String specialty);

    // Experts avec au moins X années d'expérience
    List<ExpertHassen> findByYearsOfExperienceGreaterThanEqual(Integer minYears);

    // Recherche par nom ou prénom
    @Query("SELECT e FROM ExpertHassen e WHERE LOWER(e.lastName) LIKE LOWER(CONCAT('%',:nom,'%')) OR LOWER(e.firstName) LIKE LOWER(CONCAT('%',:nom,'%'))")
    List<ExpertHassen> searchByName(@Param("nom") String nom);

    // Nombre d'experts par statut
    long countByStatus(ExpertStatus status);

    // Statistiques : nombre d'experts par zone
    @Query("SELECT e.interventionZone, COUNT(e) FROM ExpertHassen e GROUP BY e.interventionZone")
    List<Object[]> countParZone();

  @Query("SELECT e FROM ExpertHassen e WHERE e.interventionZone = :zone AND e.status = 'AVAILABLE' " +
    "ORDER BY e.performanceScore DESC, e.currentWorkload ASC")
  List<ExpertHassen> findAvailableExpertsByZone(@Param("zone") ExpertHassen.InterventionZone zone);

  // Advanced scoring for best expert assignment
  @Query("SELECT e FROM ExpertHassen e WHERE e.interventionZone = :zone AND e.status = 'AVAILABLE' " +
    "ORDER BY (e.performanceScore * 0.4 + (100 - e.currentWorkload * 10) * 0.3 + " +
    "CASE WHEN e.averageProcessingTime IS NULL THEN 50 ELSE (100 - e.averageProcessingTime) * 0.3 END) DESC")
  List<ExpertHassen> findBestExpertsForAssignment(@Param("zone") ExpertHassen.InterventionZone zone);

  // Méthode pour trouver les experts disponibles par région (nom de zone)
  default List<ExpertHassen> findAvailableExpertsByRegion(String regionName) {
    try {
      ExpertHassen.InterventionZone zone = ExpertHassen.InterventionZone.valueOf(regionName.toUpperCase().replace(" ", "_"));
      return findAvailableExpertsByZone(zone);
    } catch (IllegalArgumentException e) {
      return List.of(); // Retourne une liste vide si la zone n'existe pas
    }
  }

}
