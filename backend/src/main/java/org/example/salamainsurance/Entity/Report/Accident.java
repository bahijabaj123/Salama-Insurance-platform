package org.example.salamainsurance.Entity.Report;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "accidents")
public class Accident {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonFormat(pattern = "yyyy-MM-dd")
  private LocalDate accidentDate;

  @JsonFormat(pattern = "HH:mm:ss")
  private LocalTime time;

  private String location;

  public Accident(Long id, LocalDate accidentDate, String location, LocalTime time, Boolean injuries, Boolean propertyDamage, String observations, String sketch, AccidentStatus status, List<Driver> drivers, List<Photo> photos, List<Integer> damagedZones) {
    this.id = id;
    this.accidentDate = accidentDate;
    this.location = location;
    this.time = time;
    this.injuries = injuries;
    this.propertyDamage = propertyDamage;
    this.observations = observations;
    this.sketch = sketch;
    this.status = status;
    this.drivers = drivers;
    this.photos = photos;
    this.damagedZones = damagedZones;
  }

  private Boolean injuries;

  private Boolean propertyDamage;

  public Accident() {

  }

  public AccidentStatus getStatus() {
    return status;
  }

  public void setStatus(AccidentStatus status) {
    this.status = status;
  }

  @Column(length = 1000)
  private String observations;

  @Column(columnDefinition = "LONGTEXT")
  private String sketch;


  @Enumerated(EnumType.STRING)
  private AccidentStatus status;


  // ✅ zones endommagées (1 à 8)
  @ElementCollection
  @CollectionTable(name = "accident_damaged_zones",
    joinColumns = @JoinColumn(name = "accident_id"))
  @Column(name = "zone")
  private List<Integer> damagedZones;

  @OneToMany(mappedBy = "accident", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<Driver> drivers = new ArrayList<>();

  @OneToMany(mappedBy = "accident", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<Photo> photos = new ArrayList<>();

  @OneToOne(mappedBy = "accident")
  @JsonIgnore
  private Claim claim;

  @OneToMany(mappedBy = "accident", cascade = CascadeType.ALL, orphanRemoval = true)
  @JsonManagedReference
  private List<Damage> damages = new ArrayList<>();

  public List<Integer> getDamagedZones() {
    return damagedZones;
  }

  public void setDamagedZones(List<Integer> damagedZones) {
    this.damagedZones = damagedZones;
  }

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public LocalDate getAccidentDate() { return accidentDate; }
  public void setAccidentDate(LocalDate accidentDate) { this.accidentDate = accidentDate; }

  public LocalTime getTime() { return time; }
  public void setTime(LocalTime time) { this.time = time; }

  public String getLocation() { return location; }
  public void setLocation(String location) { this.location = location; }

  public Boolean getInjuries() { return injuries; }
  public void setInjuries(Boolean injuries) { this.injuries = injuries; }

  public Boolean getPropertyDamage() { return propertyDamage; }
  public void setPropertyDamage(Boolean propertyDamage) { this.propertyDamage = propertyDamage; }

  public String getObservations() { return observations; }
  public void setObservations(String observations) { this.observations = observations; }

  public String getSketch() { return sketch; }
  public void setSketch(String sketch) { this.sketch = sketch; }

  public List<Driver> getDrivers() { return drivers; }
  public void setDrivers(List<Driver> drivers) { this.drivers = drivers; }

  public List<Photo> getPhotos() { return photos; }
  public void setPhotos(List<Photo> photos) { this.photos = photos; }

  public Claim getClaim() { return claim; }
  public void setClaim(Claim claim) { this.claim = claim; }

  public List<Damage> getDamages() { return damages; }
  public void setDamages(List<Damage> damages) { this.damages = damages; }
}
