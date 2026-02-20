package org.example.salamainsurance.Repository.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpertReportHassenRepository extends JpaRepository<ExpertReportHassen, Integer> {
    List<ExpertReportHassen> findByExpert_IdExpert(Integer idExpert);
}