package org.example.salamainsurance.Service.Report;

import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.*;
import org.springframework.stereotype.Service;

@Service
public class ResponsibilityService {

  public ResponsibilityResult calculate(Accident accident) {

    int aTotal = 0;
    int bTotal = 0;

    for (Driver driver : accident.getDrivers()) {

      int sum = driver.getCircumstances()
        .stream()
        .mapToInt(Circumstances::getFaultPercentage)
        .sum();

      if (driver.getDriverType() == DriverType.DRIVER_A)
        aTotal = sum;

      if (driver.getDriverType() == DriverType.DRIVER_B)
        bTotal = sum;
    }

    String decision;

    if (aTotal > bTotal)
      decision = "Responsabilité conducteur A";
    else if (bTotal > aTotal)
      decision = "Responsabilité conducteur B";
    else
      decision = "Responsabilité partagée";

    return new ResponsibilityResult(aTotal, bTotal, decision);
  }
}
