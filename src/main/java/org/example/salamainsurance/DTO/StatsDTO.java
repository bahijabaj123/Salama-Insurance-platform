package org.example.salamainsurance.DTO;

import java.util.Map;

public class StatsDTO {
  private int totalAccidents;
  private int enAttente;
  private int valide;
  private int rejete;
  private Map<String, Long> parMois;
  private Map<String, Long> parCirconstance;
  private int percentResponsableA;
  private int percentResponsableB;
  private int percentPartage;

  // Constructor
  public StatsDTO(int totalAccidents, int enAttente, int valide, int rejete,
                  Map<String, Long> parMois, Map<String, Long> parCirconstance,
                  int percentResponsableA, int percentResponsableB, int percentPartage) {
    this.totalAccidents = totalAccidents;
    this.enAttente = enAttente;
    this.valide = valide;
    this.rejete = rejete;
    this.parMois = parMois;
    this.parCirconstance = parCirconstance;
    this.percentResponsableA = percentResponsableA;
    this.percentResponsableB = percentResponsableB;
    this.percentPartage = percentPartage;
  }

  public int getTotalAccidents() { return totalAccidents; }
  public int getEnAttente() { return enAttente; }
  public int getValide() { return valide; }
  public int getRejete() { return rejete; }
  public Map<String, Long> getParMois() { return parMois; }
  public Map<String, Long> getParCirconstance() { return parCirconstance; }
  public int getPercentResponsableA() { return percentResponsableA; }
  public int getPercentResponsableB() { return percentResponsableB; }
  public int getPercentPartage() { return percentPartage; }
}
