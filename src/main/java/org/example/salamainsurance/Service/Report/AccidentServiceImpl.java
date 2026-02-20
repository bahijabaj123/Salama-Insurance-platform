package org.example.salamainsurance.Service.Report;

import lombok.RequiredArgsConstructor;
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
    // ✅ CORRECTION: La méthode getDrivers() doit retourner une List<Driver>
    if (accident.getDrivers() != null) {
      for (Driver driver : accident.getDrivers()) {  // Maintenant ça fonctionne
        driver.setAccident(accident);
      }
    }

    // Pour les photos
    if (accident.getPhotos() != null) {
      for (Photo photo : accident.getPhotos()) {
        photo.setAccident(accident);
      }
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
