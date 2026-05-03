package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.MechanicRequest;
import org.example.salamainsurance.Entity.Mechanic;
import org.example.salamainsurance.Repository.MechanicRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MechanicService {

    private final MechanicRepository repository;

    public MechanicService(MechanicRepository repository) {
        this.repository = repository;
    }

    public Mechanic create(MechanicRequest request) {
        Mechanic m = new Mechanic();
        applyRequest(m, request);
        return repository.save(m);
    }

    @Transactional(readOnly = true)
    public Mechanic getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Mechanic not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Mechanic> getAll() {
        return repository.findAll();
    }

    public Mechanic update(Long id, MechanicRequest request) {
        Mechanic m = getById(id);
        applyRequest(m, request);
        return repository.save(m);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Mechanic not found: " + id);
        }
        repository.deleteById(id);
    }

    private void applyRequest(Mechanic m, MechanicRequest r) {
        m.setName(r.name());
        m.setPhone(r.phone());
        m.setEmail(r.email());
        m.setCity(r.city());
        m.setAddress(r.address());
        m.setLatitude(r.latitude());
        m.setLongitude(r.longitude());
    }
}
