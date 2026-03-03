package org.example.salamainsurance.Entity.Report;

public enum Circumstances {

  STATIONNAIT(0),
  QUITTAIT_STATIONNEMENT(20),
  OUVRAIT_PORTIERE(20),
  SORTAIT_PARKING(30),
  SENGAGEAIT_ROUTE(40),
  SENGAGEAIT_SENS_GIRATOIRE(40),
  HEURTAIT_ARRIERE(70),
  CHANGAIT_FILE(50),
  DOUBLAIT(60),
  TOURNANT_DROITE(30),
  TOURNANT_GAUCHE(50),
  RECULAIT(70),
  EMPIETAIT_SENS_INVERSE(80),
  NON_RESPECT_PRIORITE(100),
  NON_RESPECT_STOP(100);

  private final int faultPercentage;

  Circumstances(int faultPercentage) {
    this.faultPercentage = faultPercentage;
  }

  public int getFaultPercentage() {
    return faultPercentage;
  }
}
