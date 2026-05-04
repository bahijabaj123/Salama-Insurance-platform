package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.DommageHassen;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface IDommageHassenService {
    List<DommageHassen> getAllDommages();
    Optional<DommageHassen> getDommageById(Integer id);
    DommageHassen saveDommage(DommageHassen dommage);
    void deleteDommage(Integer id);
    List<DommageHassen> getDommagesByRapportId(Integer rapportId);
    List<DommageHassen> findByPointChoc(String pointChoc);
    List<DommageHassen> findByEstOccasion(Boolean estOccasion);
    List<DommageHassen> findByDesignation(String keyword);
    BigDecimal getTotalMontantByRapportId(Integer rapportId);
    long countByRapportId(Integer rapportId);
    List<DommageHassen> findByMontantSeuil(BigDecimal seuil);
    Map<String, Object> getStatsDommagesRapport(Integer rapportId);
}