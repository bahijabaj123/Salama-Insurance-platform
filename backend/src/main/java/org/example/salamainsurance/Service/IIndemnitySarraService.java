package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.IndemnitySarra;

import java.util.List;
import java.util.Optional;

public interface IIndemnitySarraService  {


    List<IndemnitySarra> getAll();

    Optional<IndemnitySarra> getById(Long id);

    void delete(Long id);

  IndemnitySarra calculateAndSave(Double gross, Integer resp, Double fixedDed);

  IndemnitySarra calculateAdvancedPayout(Long id, Double marketValueAtExpertise, Double insuredValueInContract);
    IndemnitySarra saveInitialData(Double gross, Integer resp, Double deductible);
}

