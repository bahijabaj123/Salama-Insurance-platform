package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.IndemnitySarra;

import java.util.List;
import java.util.Optional;

public interface IIndemnitySarraService  {
    IndemnitySarra calculateAndSave(Double grossAmount, Integer responsibility, Double fixedDeductible);

    List<IndemnitySarra> getAll();

    Optional<IndemnitySarra> getById(Long id);

    void delete(Long id);
}

