package org.example.salamainsurance.Repository.Report;

import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.AccidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;

public interface AccidentRepository extends JpaRepository<Accident, Long> {
  List<Accident> findByStatus(AccidentStatus status);

public interface AccidentRepository extends JpaRepository<Accident, Long> {

import java.util.List;

public interface AccidentRepository extends JpaRepository<Accident, Long> {
  List<Accident> findByStatus(AccidentStatus status);
}
