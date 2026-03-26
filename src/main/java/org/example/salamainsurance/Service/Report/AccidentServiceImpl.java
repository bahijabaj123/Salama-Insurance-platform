package org.example.salamainsurance.Service.Report;

import lombok.RequiredArgsConstructor;
<<<<<<< HEAD
import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.*;
=======
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.Driver;
import org.example.salamainsurance.Entity.Report.Photo;
>>>>>>> 2afc754fccad9612ef2f50ffe6659f379a7758e7
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
<<<<<<< HEAD
=======
    // La méthode getDrivers() doit retourner une List<Driver>
>>>>>>> 2afc754fccad9612ef2f50ffe6659f379a7758e7
    if (accident.getDrivers() != null) {
      accident.getDrivers().forEach(driver -> driver.setAccident(accident));
    }
<<<<<<< HEAD
=======

    // Pour les photos
>>>>>>> 2afc754fccad9612ef2f50ffe6659f379a7758e7
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
}
