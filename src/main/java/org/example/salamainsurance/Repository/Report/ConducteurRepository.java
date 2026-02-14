package org.example.salamainsurance.Repository.Report;


import org.example.salamainsurance.Entity.Report.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConducteurRepository extends JpaRepository<Driver, Long> {
}

