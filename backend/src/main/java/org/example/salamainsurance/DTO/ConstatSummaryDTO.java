package org.example.salamainsurance.DTO;

public class ConstatSummaryDTO {
  private Long id;
  private String accidentDate;
  private String location;
  private String status;
  private String driverAName;
  private String driverACin;
  private String driverAPhone;
  private String driverAInsurance;
  private String driverAPlate;
  private String driverBName;
  private String driverBCin;
  private String driverBPhone;
  private String driverBInsurance;
  private String driverBPlate;

  public ConstatSummaryDTO(Long id, String accidentDate, String location, String status,
                           String driverAName, String driverACin, String driverAPhone,
                           String driverAInsurance, String driverAPlate,
                           String driverBName, String driverBCin, String driverBPhone,
                           String driverBInsurance, String driverBPlate) {
    this.id = id;
    this.accidentDate = accidentDate;
    this.location = location;
    this.status = status;
    this.driverAName = driverAName;
    this.driverACin = driverACin;
    this.driverAPhone = driverAPhone;
    this.driverAInsurance = driverAInsurance;
    this.driverAPlate = driverAPlate;
    this.driverBName = driverBName;
    this.driverBCin = driverBCin;
    this.driverBPhone = driverBPhone;
    this.driverBInsurance = driverBInsurance;
    this.driverBPlate = driverBPlate;
  }

  // Getters
  public Long getId() { return id; }
  public String getAccidentDate() { return accidentDate; }
  public String getLocation() { return location; }
  public String getStatus() { return status; }
  public String getDriverAName() { return driverAName; }
  public String getDriverACin() { return driverACin; }
  public String getDriverAPhone() { return driverAPhone; }
  public String getDriverAInsurance() { return driverAInsurance; }
  public String getDriverAPlate() { return driverAPlate; }
  public String getDriverBName() { return driverBName; }
  public String getDriverBCin() { return driverBCin; }
  public String getDriverBPhone() { return driverBPhone; }
  public String getDriverBInsurance() { return driverBInsurance; }
  public String getDriverBPlate() { return driverBPlate; }
}
