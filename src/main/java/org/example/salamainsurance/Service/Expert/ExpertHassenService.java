package org.example.salamainsurance.Service.Expert;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpertHassenService implements IExpertHassenService {

    private final ExpertHassenRepository expertRepository;

    // CREATE
    public ExpertHassen createExpert(ExpertHassen expert) {
        return expertRepository.save(expert);
    }

    // READ ALL
    public List<ExpertHassen> getAllExperts() {
        return expertRepository.findAll();
    }

    // READ BY ID
    public ExpertHassen getExpertById(Integer id) {
        return expertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expert not found"));
    }

    // UPDATE
    public ExpertHassen updateExpert(Integer id, ExpertHassen newExpert) {
        ExpertHassen expert = getExpertById(id);

        expert.setFirstName(newExpert.getFirstName());
        expert.setLastName(newExpert.getLastName());
        expert.setEmail(newExpert.getEmail());
        expert.setPhone(newExpert.getPhone());
        expert.setSpecialty(newExpert.getSpecialty());
        expert.setStatus(newExpert.getStatus());
        expert.setInterventionZone(newExpert.getInterventionZone());
        expert.setRegistrationDate(newExpert.getRegistrationDate());
        expert.setYearsOfExperience(newExpert.getYearsOfExperience());

        return expertRepository.save(expert);
    }

    // DELETE
    public void deleteExpert(Integer id) {
        expertRepository.deleteById(id);
    }
}
