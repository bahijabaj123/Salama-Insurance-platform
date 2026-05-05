package org.example.salamainsurance.Repository.Expert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.example.salamainsurance.Entity.Expert.MainOeuvreHassen;
import java.math.BigDecimal;
import java.util.List;

public interface MainOeuvreHassenRepository extends JpaRepository<MainOeuvreHassen, Integer> {

    // Obtenir tous les éléments de main-d'œuvre liés à un rapport d'expert
    @Query("SELECT m FROM MainOeuvreHassen m WHERE m.rapportExpertise.idRapport = :rapportId")
    List<MainOeuvreHassen> findByRapportExpertise_IdRapport(@Param("rapportId") Integer rapportId);

    // Recherche par type de travail
    List<MainOeuvreHassen> findByTypeTravail(MainOeuvreHassen.TypeTravail typeTravail);

    // Montant total de la main-d'œuvre pour un rapport
    @Query("SELECT COALESCE(SUM(m.montant), 0) FROM MainOeuvreHassen m WHERE m.rapportExpertise.idRapport = :rapportId")
    BigDecimal sumMontantByRapportId(@Param("rapportId") Integer rapportId);

    // Compter les lignes de main-d'œuvre par rapport
    @Query("SELECT COUNT(m) FROM MainOeuvreHassen m WHERE m.rapportExpertise.idRapport = :rapportId")
    long countByRapportExpertise_IdRapport(@Param("rapportId") Integer rapportId);

    // Statistiques globales par type de travail
    @Query("SELECT m.typeTravail, COUNT(m), COALESCE(SUM(m.montant), 0) FROM MainOeuvreHassen m GROUP BY m.typeTravail")
    List<Object[]> statsParTypeTravail();
}