package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.DommageHassen;
import org.example.salamainsurance.Repository.Expert.DommageHassenRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DommageHassenService implements IDommageHassenService {

    private final DommageHassenRepository dommageRepository;

    public DommageHassenService(DommageHassenRepository dommageRepository) {
        this.dommageRepository = dommageRepository;
    }

    @Override public List<DommageHassen> getAllDommages() { return dommageRepository.findAll(); }
    @Override public Optional<DommageHassen> getDommageById(Integer id) { return dommageRepository.findById(id); }
    @Override public DommageHassen saveDommage(DommageHassen d) { return dommageRepository.save(d); }
    @Override public void deleteDommage(Integer id) { dommageRepository.deleteById(id); }

    @Override
    public List<DommageHassen> getDommagesByRapportId(Integer rapportId) {
        return dommageRepository.findByRapportExpertise_IdRapport(rapportId);
    }

    @Override public List<DommageHassen> findByPointChoc(String pointChoc) { return dommageRepository.findByPointChoc(pointChoc); }
    @Override public List<DommageHassen> findByEstOccasion(Boolean estOccasion) { return dommageRepository.findByEstOccasion(estOccasion); }
    @Override public List<DommageHassen> findByDesignation(String keyword) { return dommageRepository.findByDesignationContainingIgnoreCase(keyword); }
    @Override public BigDecimal getTotalMontantByRapportId(Integer rapportId) { return dommageRepository.sumMontantByRapportId(rapportId); }
    @Override public long countByRapportId(Integer rapportId) { return dommageRepository.countByRapportExpertise_IdRapport(rapportId); }
    @Override public List<DommageHassen> findByMontantSeuil(BigDecimal seuil) { return dommageRepository.findByMontantGreaterThanEqual(seuil); }

    @Override
    public Map<String, Object> getStatsDommagesRapport(Integer rapportId) {
        List<DommageHassen> dommages = getDommagesByRapportId(rapportId);
        BigDecimal TVA = new BigDecimal("0.19");
        BigDecimal totalHT = BigDecimal.ZERO;
        long nbOccasion = 0, nbNeuf = 0;

        for (DommageHassen d : dommages) {
            if (d.getMontant() != null) {
                BigDecimal m = d.getMontant();
                if (d.getQuantite() != null && d.getQuantite() > 1)
                    m = m.multiply(new BigDecimal(d.getQuantite()));
                totalHT = totalHT.add(m);
            }
            if (Boolean.TRUE.equals(d.getEstOccasion())) nbOccasion++; else nbNeuf++;
        }

        BigDecimal tva = totalHT.multiply(TVA).setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalTTC = totalHT.add(tva);

        Map<String, Object> stats = new HashMap<>();
        stats.put("rapportId", rapportId);
        stats.put("nombreDommages", dommages.size());
        stats.put("pieceOccasion", nbOccasion);
        stats.put("pieceNeuve", nbNeuf);
        stats.put("totalFournituresHT", totalHT);
        stats.put("tva19pct", tva);
        stats.put("totalFournituresTTC", totalTTC);
        return stats;
    }
}