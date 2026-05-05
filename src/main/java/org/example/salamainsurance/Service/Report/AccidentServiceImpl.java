package org.example.salamainsurance.Service.Report;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.*;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.Driver;
import org.example.salamainsurance.Entity.Report.Photo;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccidentServiceImpl implements AccidentService {

  private final AccidentRepository accidentRepository;

  @Override
  @Transactional
  public Accident saveAccident(Accident accident) {
    // La méthode getDrivers() doit retourner une List<Driver>
    if (accident.getDrivers() != null) {
      accident.getDrivers().forEach(driver -> driver.setAccident(accident));
    }

    // Pour les photos
    if (accident.getPhotos() != null) {
      accident.getPhotos().forEach(photo -> photo.setAccident(accident));
    }

    return accidentRepository.save(accident);
  }

  @Override
  public List<Accident> getAllAccidents() {
    return accidentRepository.findAll();
  }

  @Override
  public Accident getAccidentById(Long id) {
    return accidentRepository.findById(id).orElse(null);
  }

  @Override
  public void deleteAccident(Long id) {
    accidentRepository.deleteById(id);
  }

  @Override
  public Accident updateAccident(Long id, Accident accidentDetails) {
    if (accidentRepository.existsById(id)) {
      accidentDetails.setId(id);
      return saveAccident(accidentDetails);
    }
    return null;
  }

  @Override
  public List<Accident> getAccidentsByStatus(AccidentStatus status) {
    return List.of();
  }

  @Override
  public Accident changeStatus(Long id, AccidentStatus status) {
    return null;
  }

  public ResponsibilityResult calculateResponsibility(Long accidentId) {

    Accident accident = accidentRepository.findById(accidentId).orElseThrow();

    int scoreA = 0;
    int scoreB = 0;

    for (Driver driver : accident.getDrivers()) {

      int driverScore = driver.getCircumstances()
        .stream()
        .mapToInt(Circumstances::getFaultPercentage)
        .sum();

      if (driver.getDriverType() == DriverType.DRIVER_A)
        scoreA = driverScore;

      if (driver.getDriverType() == DriverType.DRIVER_B)
        scoreB = driverScore;
    }

    int total = scoreA + scoreB;

    int percentA = total == 0 ? 0 : (scoreA * 100) / total;
    int percentB = total == 0 ? 0 : (scoreB * 100) / total;

    String decision;

    if (percentA > percentB)
      decision = "DRIVER_A_RESPONSABLE";

    else if (percentB > percentA)
      decision = "DRIVER_B_RESPONSABLE";

    else
      decision = "RESPONSABILITE_PARTAGEE";

    return new ResponsibilityResult(percentA, percentB, decision);
  }
  @Override
  public void validateAccident(Long id) {

  }

  @Override
  public List<Accident> getAll() {
    return List.of();
  }
}
