package org.example.salamainsurance.Repository.Expert;

import org.example.salamainsurance.Entity.Expert.PhotoAccident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PhotoAccidentRepository extends JpaRepository<PhotoAccident, Integer> {

    List<PhotoAccident> findByRapport_IdRapport(Integer idRapport);

    List<PhotoAccident> findByRapport_IdRapportAndTypePhoto(Integer idRapport, PhotoAccident.TypePhoto typePhoto);

    long countByRapport_IdRapport(Integer idRapport);
}
