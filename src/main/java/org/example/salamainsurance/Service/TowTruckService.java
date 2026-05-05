package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.TowTruckRequest;
import org.example.salamainsurance.Entity.TowTruck;
import org.example.salamainsurance.Repository.TowTruckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TowTruckService {

  private final TowTruckRepository repository;

  public TowTruckService(TowTruckRepository repository) {
    this.repository = repository;
  }

  public TowTruck create(TowTruckRequest request) {
    TowTruck t = new TowTruck();
    applyRequest(t, request);
    return repository.save(t);
  }

  @Transactional(readOnly = true)
  public TowTruck getById(Long id) {
    return repository.findById(id)
      .orElseThrow(() -> new RuntimeException("TowTruck not found: " + id));
  }

  @Transactional(readOnly = true)
  public List<TowTruck> getAll() {
    return repository.findAll();
  }

  public TowTruck update(Long id, TowTruckRequest request) {
    TowTruck t = getById(id);
    applyRequest(t, request);
    return repository.save(t);
  }

  public void delete(Long id) {
    if (!repository.existsById(id)) {
      throw new RuntimeException("TowTruck not found: " + id);
    }
    repository.deleteById(id);
  }

  private void applyRequest(TowTruck t, TowTruckRequest r) {
    t.setName(r.name());
    t.setPhone(r.phone());
    t.setEmail(r.email());
    t.setCompany(r.company());
    t.setAddress(r.address());
    t.setLatitude(r.latitude());
    t.setLongitude(r.longitude());
  }
}
