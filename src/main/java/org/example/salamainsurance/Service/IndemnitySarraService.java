package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IndemnitySarraService implements IIndemnitySarraService {
    @Autowired
    private IndemnityRepository indemnityRepository;
    @Override
    public IndemnitySarra calculateAndSave(Double grossAmount, Integer responsibility, Double fixedDeductible) {

        IndemnitySarra indemnity = new IndemnitySarra();
        indemnity.setGrossAmount(grossAmount);
        indemnity.setResponsibility(responsibility);



        Double calculatedDeductible = 0.0;


        if (responsibility != null) {
            if (responsibility == 100) {
                calculatedDeductible = fixedDeductible;
            } else if (responsibility == 50) {

                calculatedDeductible = (fixedDeductible != null) ? fixedDeductible / 2 : 0.0;
            }
        }

        indemnity.setDeductibleValue(calculatedDeductible);

        // 3. Calcul du montant net
        // Math.max attend deux nombres du même type. Utilise 0.0 pour matcher avec le résultat du calcul.
        Double netAmount = Math.max(0.0, (grossAmount != null ? grossAmount : 0.0) - calculatedDeductible);
        indemnity.setNetAmount(netAmount);

        // 4. Sauvegarde
        return indemnityRepository.save(indemnity);
    }

    public List<IndemnitySarra> getAll() {
        return indemnityRepository.findAll();
    }

    public Optional<IndemnitySarra> getById(Long id) {
        return indemnityRepository.findById(id);
    }
@Override
    public void delete(Long id) {
        indemnityRepository.deleteById(id);
    }
}