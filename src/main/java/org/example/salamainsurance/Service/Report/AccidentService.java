package org.example.salamainsurance.Service.Report;


import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.AccidentStatus;

import java.util.List;

public interface AccidentService {

  Accident saveAccident(Accident accident);

  List<Accident> getAllAccidents();

  Accident getAccidentById(Long id);

  void deleteAccident(Long id);

  Accident updateAccident(Long id, Accident accidentDetails);

  List<Accident> getAccidentsByStatus(AccidentStatus status);

  Accident changeStatus(Long id, AccidentStatus status);

  ResponsibilityResult calculateResponsibility(Long id);

  void validateAccident(Long id);

  List<Accident> getAll();
}




