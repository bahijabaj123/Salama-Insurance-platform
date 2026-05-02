package org.example.salamainsurance.Entity.Report;

public enum Circumstances {

  STATIONNAIT(0),
  QUITTAIT_STATIONNEMENT(20),
  PRENAIT_STATIONNEMENT(10),
  SORTAIT_PARKING(30),
  SENGAGEAIT_PARKING(40),
  ARRET_CIRCULATION(0),
  FROTTEMENT_SANS_CHANGEMENT(50),
  HEURTAIT_ARRIERE(70),
  MEME_SENS_FILE_DIFFERENTE(60),
  CHANGAIT_FILE(50),
  DOUBLAIT(60),
  TOURNANT_DROITE(30),
  TOURNANT_GAUCHE(50),
  RECULAIT(70),
  EMPIETAIT_SENS_INVERSE(80),
  VENAIT_DROITE_CARREFOUR(100),
  NON_RESPECT_PRIORITE(100);

  private final int faultPercentage;

  Circumstances(int faultPercentage) {
    this.faultPercentage = faultPercentage;
  }

  public int getFaultPercentage() {
    return faultPercentage;
  }
}
