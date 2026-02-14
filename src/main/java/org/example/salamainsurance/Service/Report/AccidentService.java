package org.example.salamainsurance.Service.Report;


import org.example.salamainsurance.Entity.Report.Accident;
import java.util.List;

public interface AccidentService {

  Accident saveAccident(Accident accident);

  List<Accident> getAllAccidents();

  Accident getAccidentById(Long id);

  void deleteAccident(Long id);

  Accident updateAccident(Long id, Accident accidentDetails);
}

