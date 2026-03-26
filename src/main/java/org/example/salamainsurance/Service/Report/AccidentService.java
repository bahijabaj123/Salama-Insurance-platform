package org.example.salamainsurance.Service.Report;


import org.example.salamainsurance.Entity.Report.Accident;
import java.util.List;

public interface AccidentService {

  Accident saveAccident(Accident accident);

  List<Accident> getAllAccidents();

  Accident getAccidentById(Long id);

  void deleteAccident(Long id);

  Accident updateAccident(Long id, Accident accidentDetails);
<<<<<<< HEAD

  List<Accident> getAccidentsByStatus(AccidentStatus status);

  Accident changeStatus(Long id, AccidentStatus status);

  ResponsibilityResult calculateResponsibility(Long id);

  void validateAccident(Long id);
}
=======
}



>>>>>>> 2afc754fccad9612ef2f50ffe6659f379a7758e7
