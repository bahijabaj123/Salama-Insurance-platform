package org.example.salamainsurance.Repository.Expert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.example.salamainsurance.Entity.Expert.DommageHassen;
import java.math.BigDecimal;
import java.util.List;

public interface DommageHassenRepository extends JpaRepository<DommageHassen, Integer> {

    // Récupérer tous les dommages liés à un rapport d'expertise (champ : rapportExpertise, PK du rapport : idRapport)
    @Query("SELECT d FROM DommageHassen d WHERE d.rapportExpertise.idRapport = :rapportId")
    List<DommageHassen> findByRapportExpertise_IdRapport(@Param("rapportId") Integer rapportId);

    // Recherche par point de choc
    List<DommageHassen> findByPointChoc(String pointChoc);

    // Recherche pièces utilisées uniquement
    List<DommageHassen> findByEstOccasion(Boolean estOccasion);

    // Recherche par désignation contenant un mot-clé
    List<DommageHassen> findByDesignationContainingIgnoreCase(String keyword);

    // Montant total HT pour un rapport
    @Query("SELECT COALESCE(SUM(d.montant * COALESCE(d.quantite, 1)), 0) FROM DommageHassen d WHERE d.rapportExpertise.idRapport = :rapportId")
    BigDecimal sumMontantByRapportId(@Param("rapportId") Integer rapportId);

    // Compter les dommages par rapport
    @Query("SELECT COUNT(d) FROM DommageHassen d WHERE d.rapportExpertise.idRapport = :rapportId")
    long countByRapportExpertise_IdRapport(@Param("rapportId") Integer rapportId);

    // Dommages au-dessus d'un montant seuil
    @Query("SELECT d FROM DommageHassen d WHERE d.montant >= :seuil")
    List<DommageHassen> findByMontantGreaterThanEqual(@Param("seuil") BigDecimal seuil);
}