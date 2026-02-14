package org.example.salamainsurance.Service.Report;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccidentServiceImpl implements AccidentService {

  private final AccidentRepository accidentRepository;

  @Override
  @Transactional // Très important pour gérer les relations cascade
  public Accident saveAccident(Accident accident) {
    // ÉTAPE CRUCIALE : On lie manuellement chaque Driver à l'Accident
    if (accident.getDrivers() != null) {
      accident.getDrivers().forEach(driver -> driver.setAccident(accident));
    }

    // ÉTAPE CRUCIALE : On lie manuellement chaque Photo à l'Accident
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
    // Optionnel : Logique pour mettre à jour un accident existant
    if (accidentRepository.existsById(id)) {
      accidentDetails.setId(id);
      return saveAccident(accidentDetails);
    }
    return null;
  }
}
