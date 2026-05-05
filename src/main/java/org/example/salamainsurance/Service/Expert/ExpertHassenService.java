package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.springframework.stereotype.Service;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpertHassenService implements IExpertHassenService {

    private final ExpertHassenRepository expertRepository;

    public ExpertHassenService(ExpertHassenRepository expertRepository) {

      this.expertRepository = expertRepository;
    }

    // CREATE
    @Override
    public ExpertHassen createExpert(ExpertHassen expert) {
        return expertRepository.save(expert);
    }

    // READ ALL
    @Override
    public List<ExpertHassen> getAllExperts() {
        return expertRepository.findAll();
    }

    // READ BY ID
    @Override
    public ExpertHassen getExpertById(Integer id) {
        return expertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expert non trouvé avec l'ID: " + id));
    }

    // UPDATE
    @Override
    public ExpertHassen updateExpert(Integer id, ExpertHassen newExpert) {
        ExpertHassen expert = getExpertById(id);

        expert.setFirstName(newExpert.getFirstName());
        expert.setLastName(newExpert.getLastName());
        expert.setAddress(newExpert.getAddress());
        expert.setCity(newExpert.getCity());
        expert.setPostalCode(newExpert.getPostalCode());
        expert.setEmail(newExpert.getEmail());
        expert.setPhone(newExpert.getPhone());
        expert.setFax(newExpert.getFax());
        expert.setSpecialty(newExpert.getSpecialty());
      expert.setStatus(newExpert.getStatus());
        expert.setInterventionZone(newExpert.getInterventionZone());
        expert.setRegistrationDate(newExpert.getRegistrationDate());
        expert.setYearsOfExperience(newExpert.getYearsOfExperience());

        return expertRepository.save(expert);
    }

    // DELETE
    @Override
    public void deleteExpert(Integer id) {
        if (!expertRepository.existsById(id)) {
            throw new RuntimeException("Expert non trouvé avec l'ID: " + id);
        }
        expertRepository.deleteById(id);
    }

    // SEARCH BY ZONE
    @Override
    public List<ExpertHassen> findByInterventionZone(ExpertHassen.InterventionZone zone) {
        return expertRepository.findByInterventionZone(zone);
    }

  // SEARCH BY STATUS
    @Override
    public List<ExpertHassen> findByStatus(ExpertStatus status) {
      return expertRepository.findByStatus(status);
    }

    // ===== MÉTHODES AVANCÉES =====

    @Override
    public List<ExpertHassen> findBySpecialty(String specialty) {
        return expertRepository.findBySpecialtyContainingIgnoreCase(specialty);
    }

    @Override
    public List<ExpertHassen> searchByName(String nom) {
        return expertRepository.searchByName(nom);
    }

    @Override
    public List<ExpertHassen> findByExperienceMin(Integer minYears) {
        return expertRepository.findByYearsOfExperienceGreaterThanEqual(minYears);
    }

  @Override
    @Transactional
    public ExpertHassen changeStatus(Integer id, ExpertStatus newStatus) {
        ExpertHassen expert = getExpertById(id);
        expert.setStatus(newStatus);
        return expertRepository.save(expert);
    }

    @Override
    public Map<String, Object> getExpertStatistics() {
        long totalExperts = expertRepository.count();
      long actifs = expertRepository.countByStatus(ExpertStatus.ACTIVE);
      long inactifs = expertRepository.countByStatus(ExpertStatus.INACTIVE);

        List<Object[]> parZone = expertRepository.countParZone();
        Map<String, Long> repartitionZone = new LinkedHashMap<>();
        for (Object[] row : parZone) {
            repartitionZone.put(row[0] != null ? row[0].toString() : "NON_DEFINIE", (Long) row[1]);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalExperts", totalExperts);
        stats.put("expertsActifs", actifs);
        stats.put("expertsInactifs", inactifs);
        stats.put("repartitionParZone", repartitionZone);
        return stats;
    }


}
