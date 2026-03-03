package org.example.salamainsurance.Repository.Report;

import org.example.salamainsurance.Entity.Report.Accident;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccidentRepository extends JpaRepository<Accident, Long> {
}
