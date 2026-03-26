package org.example.salamainsurance.Repository.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.Expert.ExpertiseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpertReportHassenRepository extends JpaRepository<ExpertReportHassen, Integer> {

    List<ExpertReportHassen> findByExpert_IdExpert(Integer idExpert);

    @Query("SELECT r FROM ExpertReportHassen r " +
           "LEFT JOIN FETCH r.expert " +
           "LEFT JOIN FETCH r.dommages " +
           "LEFT JOIN FETCH r.mainsOeuvre " +
           "LEFT JOIN FETCH r.piecesJointes " +
           "WHERE r.idRapport = :id")
    Optional<ExpertReportHassen> findByIdWithAllRelations(@Param("id") Integer id);

    Optional<ExpertReportHassen> findByNumeroReference(String numeroReference);

  List<ExpertReportHassen> findByStatutRapport(ExpertiseStatus statut);

    List<ExpertReportHassen> findByDateMissionBetween(LocalDate start, LocalDate end);

    List<ExpertReportHassen> findByMandantAssuranceContainingIgnoreCase(String assurance);

    List<ExpertReportHassen> findByVehiculeImmatriculation(String immatriculation);
}
