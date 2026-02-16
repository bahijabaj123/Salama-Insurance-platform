package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;

import java.util.List;

public interface IExpertHassenService {

    ExpertHassen createExpert(ExpertHassen expert);

    List<ExpertHassen> getAllExperts();

    ExpertHassen getExpertById(Integer id);

    ExpertHassen updateExpert(Integer id, ExpertHassen expert);

    void deleteExpert(Integer id);
}
