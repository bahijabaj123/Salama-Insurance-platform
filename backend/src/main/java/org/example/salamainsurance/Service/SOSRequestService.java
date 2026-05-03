package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.SOSRequestRequest;
import org.example.salamainsurance.Entity.*;
import org.example.salamainsurance.Repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SOSRequestService {

  private final SOSRequestRepository repository;
  private final RepairShopLindaRepository garageRepository;
  private final MechanicRepository mechanicRepository;
  private final TowTruckRepository towTruckRepository;

  public SOSRequestService(SOSRequestRepository repository,
                           RepairShopLindaRepository garageRepository,
                           MechanicRepository mechanicRepository,
                           TowTruckRepository towTruckRepository) {
    this.repository = repository;
    this.garageRepository = garageRepository;
    this.mechanicRepository = mechanicRepository;
    this.towTruckRepository = towTruckRepository;
  }

  public SOSRequest create(SOSRequestRequest request) {
    SOSRequest entity = new SOSRequest();
    applyRequest(entity, request);
    return repository.save(entity);
  }

  @Transactional(readOnly = true)
  public SOSRequest getById(Long id) {
    return repository.findById(id)
      .orElseThrow(() -> new RuntimeException("SOSRequest not found: " + id));
  }

  @Transactional(readOnly = true)
  public List<SOSRequest> getAll() {
    return repository.findAll();
  }

  public SOSRequest update(Long id, SOSRequestRequest request) {
    SOSRequest entity = getById(id);
    applyRequest(entity, request);
    return repository.save(entity);
  }

  public void delete(Long id) {
    if (!repository.existsById(id)) {
      throw new RuntimeException("SOSRequest not found: " + id);
    }
    repository.deleteById(id);
  }

  @Transactional(readOnly = true)
  public List<SOSRequest> getByType(SOSRequest.SOSType type) {
    return repository.findByType(type);
  }

  @Transactional(readOnly = true)
  public List<SOSRequest> getByStatus(SOSRequest.SOSStatus status) {
    return repository.findByStatus(status);
  }

  private void applyRequest(SOSRequest entity, SOSRequestRequest request) {
    entity.setType(request.type());
    entity.setClientName(request.clientName());
    entity.setClientPhone(request.clientPhone());
    entity.setLatitude(request.latitude());
    entity.setLongitude(request.longitude());
    entity.setDescription(request.description());
    entity.setStatus(request.status());

    entity.setGarage(null);
    entity.setMechanic(null);
    entity.setTowTruck(null);

    switch (request.type()) {
      case GARAGE -> {
        if (request.garageId() != null) {
          RepairShopLinda garage = garageRepository.findById(request.garageId())
            .orElseThrow(() -> new RuntimeException("Garage not found: " + request.garageId()));
          entity.setGarage(garage);
        }
      }
      case MECANICIEN -> {
        if (request.mechanicId() != null) {
          Mechanic mechanic = mechanicRepository.findById(request.mechanicId())
            .orElseThrow(() -> new RuntimeException("Mechanic not found: " + request.mechanicId()));
          entity.setMechanic(mechanic);
        }
      }
      case REMORQUAGE -> {
        if (request.towTruckId() != null) {
          TowTruck towTruck = towTruckRepository.findById(request.towTruckId())
            .orElseThrow(() -> new RuntimeException("TowTruck not found: " + request.towTruckId()));
          entity.setTowTruck(towTruck);
        }
      }
    }
  }
}
