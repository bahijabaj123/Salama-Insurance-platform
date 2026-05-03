package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.MainOeuvreHassen;
import org.example.salamainsurance.Repository.Expert.MainOeuvreHassenRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class MainOeuvreHassenService implements IMainOeuvreHassenService {

    private final MainOeuvreHassenRepository mainOeuvreRepository;

    public MainOeuvreHassenService(MainOeuvreHassenRepository mainOeuvreRepository) {
        this.mainOeuvreRepository = mainOeuvreRepository;
    }

    @Override public List<MainOeuvreHassen> getAllMainOeuvres() { return mainOeuvreRepository.findAll(); }
    @Override public Optional<MainOeuvreHassen> getMainOeuvreById(Integer id) { return mainOeuvreRepository.findById(id); }
    @Override public MainOeuvreHassen saveMainOeuvre(MainOeuvreHassen m) { return mainOeuvreRepository.save(m); }
    @Override public void deleteMainOeuvre(Integer id) { mainOeuvreRepository.deleteById(id); }

    @Override
    public List<MainOeuvreHassen> getMainOeuvresByRapportId(Integer rapportId) {
        return mainOeuvreRepository.findByRapportExpertise_IdRapport(rapportId);
    }

    @Override
    public List<MainOeuvreHassen> findByTypeTravail(MainOeuvreHassen.TypeTravail typeTravail) {
        return mainOeuvreRepository.findByTypeTravail(typeTravail);
    }

    @Override public BigDecimal getTotalMontantByRapportId(Integer rapportId) { return mainOeuvreRepository.sumMontantByRapportId(rapportId); }
    @Override public long countByRapportId(Integer rapportId) { return mainOeuvreRepository.countByRapportExpertise_IdRapport(rapportId); }

    @Override
    public Map<String, Object> getStatsParTypeTravail() {
        List<Object[]> rows = mainOeuvreRepository.statsParTypeTravail();
        Map<String, Object> stats = new LinkedHashMap<>();
        for (Object[] row : rows) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("count", row[1]);
            detail.put("totalMontant", row[2]);
            stats.put(row[0].toString(), detail);
        }
        return stats;
    }

    @Override
    public Map<String, Object> getResumeFinancierRapport(Integer rapportId) {
        List<MainOeuvreHassen> lignes = getMainOeuvresByRapportId(rapportId);
        BigDecimal TVA = new BigDecimal("0.19");
        BigDecimal totalHT = BigDecimal.ZERO;
        Map<String, BigDecimal> parType = new LinkedHashMap<>();

        for (MainOeuvreHassen m : lignes) {
            if (m.getMontant() != null) {
                totalHT = totalHT.add(m.getMontant());
                String type = m.getTypeTravail() != null ? m.getTypeTravail().name() : "AUTRE";
                parType.merge(type, m.getMontant(), BigDecimal::add);
            }
        }

        BigDecimal tva = totalHT.multiply(TVA).setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalTTC = totalHT.add(tva);

        Map<String, Object> resume = new LinkedHashMap<>();
        resume.put("rapportId", rapportId);
        resume.put("nombreLignes", lignes.size());
        resume.put("totalMainOeuvreHT", totalHT);
        resume.put("tva19pct", tva);
        resume.put("totalMainOeuvreTTC", totalTTC);
        resume.put("detailParType", parType);
        return resume;
    }
}