package org.example.salamainsurance.Repository.Expert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.example.salamainsurance.Entity.Expert.PieceJointeHassen;
import java.util.List;

public interface PieceJointeHassenRepository extends JpaRepository<PieceJointeHassen, Integer> {
    // Récupérer toutes les pièces jointes liées à un rapport d'expertise
    @Query("SELECT p FROM PieceJointeHassen p WHERE p.rapportExpertise.idRapport = :rapportId")
    List<PieceJointeHassen> findByRapportExpertise_IdRapport(@Param("rapportId") Integer rapportId);
}