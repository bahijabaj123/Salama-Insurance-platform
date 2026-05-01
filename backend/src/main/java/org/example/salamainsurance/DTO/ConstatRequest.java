package org.example.salamainsurance.DTO;

import java.util.List;

public class ConstatRequest {
  private String accidentDate;
  private String time;
  private String location;
  private boolean injuries;
  private boolean propertyDamage;
  private String observations;
  private String status;
  private String sketch;           // base64 ou URL
  private List<PhotoRequest> photos;
  private List<DriverRequest> drivers;
  private List<Integer> damagedZones;
  private List<DamageRequest> damages;

  public List<DamageRequest> getDamages() {
    return damages;
  }

  public void setDamages(List<DamageRequest> damages) {
    this.damages = damages;
  }

  public List<Integer> getDamagedZones() {
    return damagedZones;
  }

  public void setDamagedZones(List<Integer> damagedZones) {
    this.damagedZones = damagedZones;
  }

  public String getAccidentDate() {
    return accidentDate;
  }

  public String getTime() {
    return time;
  }

  public void setTime(String time) {
    this.time = time;
  }

  public void setAccidentDate(String accidentDate) {
    this.accidentDate = accidentDate;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public boolean isInjuries() {
    return injuries;
  }

  public void setInjuries(boolean injuries) {
    this.injuries = injuries;
  }

  public String getObservations() {
    return observations;
  }

  public void setObservations(String observations) {
    this.observations = observations;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getSketch() {
    return sketch;
  }

  public void setSketch(String sketch) {
    this.sketch = sketch;
  }

  public List<DriverRequest> getDrivers() {
    return drivers;
  }

  public void setDrivers(List<DriverRequest> drivers) {
    this.drivers = drivers;
  }

  public List<PhotoRequest> getPhotos() {
    return photos;
  }

  public void setPhotos(List<PhotoRequest> photos) {
    this.photos = photos;
  }

  public boolean isPropertyDamage() {
    return propertyDamage;
  }

  public void setPropertyDamage(boolean propertyDamage) {
    this.propertyDamage = propertyDamage;
  }

  // getters/setters
}



