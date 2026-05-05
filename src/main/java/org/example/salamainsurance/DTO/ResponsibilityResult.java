package org.example.salamainsurance.DTO;

public class ResponsibilityResult {

  private int driverAResponsibility;
  private int driverBResponsibility;
  private String decision;

  public ResponsibilityResult(int a, int b, String decision) {
    this.driverAResponsibility = a;
    this.driverBResponsibility = b;
    this.decision = decision;
  }

  public int getDriverAResponsibility() {
    return driverAResponsibility;
  }

  public int getDriverBResponsibility() {
    return driverBResponsibility;
  }

  public String getDecision() {
    return decision;
  }
}
