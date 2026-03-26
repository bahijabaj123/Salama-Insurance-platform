package org.example.salamainsurance.Repository.Report;

import org.example.salamainsurance.Entity.Report.Accident;
import org.springframework.data.jpa.repository.JpaRepository;

<<<<<<< HEAD
import java.util.List;

public interface AccidentRepository extends JpaRepository<Accident, Long> {
  List<Accident> findByStatus(AccidentStatus status);
=======
public interface AccidentRepository extends JpaRepository<Accident, Long> {
>>>>>>> 2afc754fccad9612ef2f50ffe6659f379a7758e7
}
