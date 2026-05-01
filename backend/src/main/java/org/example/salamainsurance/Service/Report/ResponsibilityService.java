package org.example.salamainsurance.Service.Report;

import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.*;
import org.springframework.stereotype.Service;

@Service
public class ResponsibilityService {

  public ResponsibilityResult calculate(Accident accident) {
    int scoreA = 0;
    int scoreB = 0;

    for (Driver driver : accident.getDrivers()) {
      int driverScore = driver.getCircumstances() == null ? 0 :
        driver.getCircumstances()
          .stream()
          .mapToInt(Circumstances::getFaultPercentage)
          .max()
          .orElse(0);

      if (driver.getDriverType() == DriverType.DRIVER_A) scoreA = driverScore;
      if (driver.getDriverType() == DriverType.DRIVER_B) scoreB = driverScore;
    }

    int total = scoreA + scoreB;
    int percentA, percentB;

    if (total == 0) {
      percentA = 50;
      percentB = 50;
    } else {
      percentA = (scoreA * 100) / total;
      percentB = 100 - percentA;
    }

    String decision;
    if (percentA > percentB)
      decision = "DRIVER_A_RESPONSABLE";
    else if (percentB > percentA)
      decision = "DRIVER_B_RESPONSABLE";
    else
      decision = "RESPONSABILITE_PARTAGEE";

    return new ResponsibilityResult(percentA, percentB, decision);
  }
}
