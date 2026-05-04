package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.MainOeuvreHassen;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface IMainOeuvreHassenService {

    List<MainOeuvreHassen> getAllMainOeuvres();

    Optional<MainOeuvreHassen> getMainOeuvreById(Integer id);

    MainOeuvreHassen saveMainOeuvre(MainOeuvreHassen mainOeuvre);

    void deleteMainOeuvre(Integer id);

    List<MainOeuvreHassen> getMainOeuvresByRapportId(Integer rapportId);

    List<MainOeuvreHassen> findByTypeTravail(MainOeuvreHassen.TypeTravail typeTravail);

    BigDecimal getTotalMontantByRapportId(Integer rapportId);

    long countByRapportId(Integer rapportId);

    Map<String, Object> getStatsParTypeTravail();

    Map<String, Object> getResumeFinancierRapport(Integer rapportId);
}