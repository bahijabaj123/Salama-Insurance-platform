package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.GarageAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface GarageAvailabilityRepository extends JpaRepository<GarageAvailability, Long> {

    List<GarageAvailability> findByGarageIdAndDateBetween(Long garageId, LocalDate start, LocalDate end);
}

