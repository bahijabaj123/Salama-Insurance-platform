package org.example.salamainsurance.Service.Report;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.DTO.*;
import org.example.salamainsurance.Entity.Report.*;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.example.salamainsurance.Repository.Report.DamageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccidentServiceImpl implements AccidentService {

  private final AccidentRepository accidentRepository;

  @Autowired
  private ResponsibilityService responsibilityService;

  @Autowired
  private PdfService pdfService;

  private final DamageRepository damageRepository;

  @Override
  @Transactional
  public Accident saveAccident(Accident accident) {
    if (accident.getDrivers() != null) {
      accident.getDrivers().forEach(driver -> driver.setAccident(accident));
    }
    if (accident.getPhotos() != null) {
      accident.getPhotos().forEach(photo -> photo.setAccident(accident));
    }
    return accidentRepository.save(accident);
  }

  @Override
  public List<Accident> getAllAccidents() {
    return accidentRepository.findAll();
  }

  @Override
  public List<Accident> getAll() {
    return accidentRepository.findAll();
  }

  @Override
  public Accident getAccidentById(Long id) {
    return accidentRepository.findById(id).orElse(null);
  }

  @Override
  public void deleteAccident(Long id) {
    accidentRepository.deleteById(id);
  }

  @Override
  public Accident updateAccident(Long id, Accident accidentDetails) {
    if (accidentRepository.existsById(id)) {
      accidentDetails.setId(id);
      return saveAccident(accidentDetails);
    }
    return null;
  }

  @Override
  public List<Accident> getAccidentsByStatus(AccidentStatus status) {
    return accidentRepository.findByStatus(status);
  }

  @Override
  public Accident changeStatus(Long id, AccidentStatus status) {
    Accident accident = getAccidentById(id);
    if (accident != null) {
      accident.setStatus(status);
      return accidentRepository.save(accident);
    }
    return null;
  }

  @Override
  public ResponsibilityResult calculateResponsibility(Long accidentId) {
    Accident accident = accidentRepository.findById(accidentId).orElseThrow();
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

  @Override
  public void validateAccident(Long id) {
    Accident accident = accidentRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Accident non trouvé"));

    System.out.println("=== validateAccident - sketch: " +
      (accident.getSketch() != null ? "OUI " + accident.getSketch().length() + " chars" : "NON"));

    accident.setStatus(AccidentStatus.VALIDE);
    ResponsibilityResult result = responsibilityService.calculate(accident);
    accidentRepository.save(accident);

    // Recharger depuis la base pour avoir toutes les données fraîches
    Accident freshAccident = accidentRepository.findById(id)
      .orElseThrow(() -> new RuntimeException("Accident non trouvé"));

    System.out.println("=== freshAccident - sketch: " +
      (freshAccident.getSketch() != null ? "OUI " + freshAccident.getSketch().length() + " chars" : "NON"));

    pdfService.generatePdf(freshAccident, result);
  }

  @Override
  @Transactional
  public Accident createConstatFromRequest(ConstatRequest request) {
    LocalDate accidentDate = LocalDate.parse(request.getAccidentDate());
    LocalTime accidentTime = LocalTime.parse(request.getTime());

    Accident accident = new Accident();
    accident.setAccidentDate(accidentDate);
    accident.setTime(accidentTime);
    accident.setLocation(request.getLocation());
    accident.setInjuries(request.isInjuries());
    accident.setPropertyDamage(request.isPropertyDamage());
    accident.setObservations(request.getObservations());
    accident.setStatus(AccidentStatus.EN_ATTENTE);
    accident.setSketch(request.getSketch());

    // damagedZones
    if (request.getDamagedZones() != null) {
      accident.setDamagedZones(request.getDamagedZones());
    }

    // Photos
    List<Photo> photos = new ArrayList<>();
    if (request.getPhotos() != null) {
      for (PhotoRequest p : request.getPhotos()) {
        String fileName = saveBase64Image(p.getUrl());
        Photo photo = new Photo();
        photo.setFileName(fileName);
        photo.setAccident(accident);
        photos.add(photo);
      }
    }
    accident.setPhotos(photos);

    // Drivers + Circumstances
    List<Driver> drivers = new ArrayList<>();
    if (request.getDrivers() != null) {
      for (DriverRequest d : request.getDrivers()) {
        Driver driver = new Driver();
        driver.setDriverType(DriverType.valueOf(d.getDriverType()));
        driver.setName(d.getName());
        driver.setCin(d.getCin());
        driver.setAddress(d.getAddress());
        driver.setPhoneNumber(d.getPhoneNumber());
        driver.setLicenseNumber(d.getLicenseNumber());
        driver.setInsuranceCompany(d.getInsuranceCompany());
        driver.setPolicyNumber(d.getPolicyNumber());
        driver.setLicensePlate(d.getLicensePlate());
        driver.setCarMake(d.getCarMake());
        driver.setSignature(d.getSignature());
        driver.setAccident(accident);

        if (d.getCircumstances() != null) {
          List<Circumstances> circs = d.getCircumstances()
            .stream()
            .map(Circumstances::valueOf)
            .collect(Collectors.toList());
          driver.setCircumstances(circs);
        }

        drivers.add(driver);
      }
    }
    accident.setDrivers(drivers);

    // ✅ Damages — attachés à l'accident via la relation
    if (request.getDamages() != null && !request.getDamages().isEmpty()) {
      List<Damage> damageList = new ArrayList<>();
      for (DamageRequest d : request.getDamages()) {
        Damage damage = new Damage();
        damage.setPart(d.getPart());
        damage.setType(d.getType());
        damage.setDescription(d.getDescription());
        damage.setCost(d.getCost() != null ? d.getCost() : 0.0);
        damage.setDriver(d.getDriver());
        damage.setAccident(accident);
        damageList.add(damage);
      }
      accident.setDamages(damageList);
    }

    return accidentRepository.save(accident);
  }

  @Override
  public void saveDamages(Long accidentId, List<DamageRequest> damages) {
    Accident accident = accidentRepository.findById(accidentId)
      .orElseThrow(() -> new RuntimeException("Accident non trouvé : " + accidentId));

    for (DamageRequest d : damages) {
      Damage damage = new Damage();
      damage.setPart(d.getPart());
      damage.setType(d.getType());
      damage.setDescription(d.getDescription());
      damage.setCost(d.getCost());
      damage.setDriver(d.getDriver());
      damage.setAccident(accident);
      damageRepository.save(damage);
    }
  }

  private String saveBase64Image(String base64Data) {
    try {
      String[] parts = base64Data.split(",");
      String imageData = parts.length > 1 ? parts[1] : parts[0];
      byte[] imageBytes = Base64.getDecoder().decode(imageData);
      String extension = "png";
      if (base64Data.contains("jpeg") || base64Data.contains("jpg")) {
        extension = "jpg";
      } else if (base64Data.contains("png")) {
        extension = "png";
      }
      String fileName = UUID.randomUUID().toString() + "." + extension;
      Path uploadPath = Paths.get("uploads/photos");
      if (!Files.exists(uploadPath)) {
        Files.createDirectories(uploadPath);
      }
      Path filePath = uploadPath.resolve(fileName);
      Files.write(filePath, imageBytes);
      return fileName;
    } catch (IOException e) {
      throw new RuntimeException("Erreur lors de la sauvegarde de l'image", e);
    }
  }

  @Override
  public StatsDTO getStats() {
    List<Accident> all = accidentRepository.findAll();

    int total = all.size();
    int enAttente = 0, valide = 0, rejete = 0;
    int responsableA = 0, responsableB = 0, partage = 0;

    Map<String, Long> parMois = new java.util.TreeMap<>();
    Map<String, Long> parCirconstance = new java.util.HashMap<>();

    for (Accident a : all) {
      // Statuts
      if (a.getStatus() == AccidentStatus.EN_ATTENTE) enAttente++;
      else if (a.getStatus() == AccidentStatus.VALIDE) valide++;
      else if (a.getStatus() == AccidentStatus.REJETE) rejete++;

      // Par mois
      String mois = a.getAccidentDate().format(
        java.time.format.DateTimeFormatter.ofPattern("yyyy-MM"));
      parMois.merge(mois, 1L, Long::sum);

      // Circonstances
      for (Driver driver : a.getDrivers()) {
        if (driver.getCircumstances() != null) {
          for (Circumstances c : driver.getCircumstances()) {
            parCirconstance.merge(c.name(), 1L, Long::sum);
          }
        }
      }

      // Responsabilité (seulement accidents validés)
      if (a.getStatus() == AccidentStatus.VALIDE) {
        ResponsibilityResult r = responsibilityService.calculate(a);
        if ("DRIVER_A_RESPONSABLE".equals(r.getDecision())) responsableA++;
        else if ("DRIVER_B_RESPONSABLE".equals(r.getDecision())) responsableB++;
        else partage++;
      }
    }

    int totalValide = responsableA + responsableB + partage;
    int pA = totalValide == 0 ? 0 : (responsableA * 100) / totalValide;
    int pB = totalValide == 0 ? 0 : (responsableB * 100) / totalValide;
    int pP = totalValide == 0 ? 0 : 100 - pA - pB;

    // Top 5 circonstances
    Map<String, Long> top5 = parCirconstance.entrySet().stream()
      .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
      .limit(5)
      .collect(java.util.LinkedHashMap::new,
        (m, e) -> m.put(e.getKey(), e.getValue()),
        java.util.LinkedHashMap::putAll);

    return new StatsDTO(total, enAttente, valide, rejete, parMois, top5, pA, pB, pP);
  }

  @Override
  public List<ConstatSummaryDTO> getRecentConstats() {
    List<Accident> all = accidentRepository.findAll();
    List<ConstatSummaryDTO> result = new ArrayList<>();

    for (Accident a : all) {
      String driverAName = "", driverACin = "", driverAPhone = "", driverAInsurance = "", driverAPlate = "";
      String driverBName = "", driverBCin = "", driverBPhone = "", driverBInsurance = "", driverBPlate = "";

      if (a.getDrivers() != null) {
        for (Driver d : a.getDrivers()) {
          if (d.getDriverType() == DriverType.DRIVER_A) {
            driverAName      = d.getName()             != null ? d.getName()             : "";
            driverACin       = d.getCin()              != null ? d.getCin()              : "";
            driverAPhone     = d.getPhoneNumber()      != null ? d.getPhoneNumber()      : "";
            driverAInsurance = d.getInsuranceCompany() != null ? d.getInsuranceCompany() : "";
            driverAPlate     = d.getLicensePlate()     != null ? d.getLicensePlate()     : "";
          } else if (d.getDriverType() == DriverType.DRIVER_B) {
            driverBName      = d.getName()             != null ? d.getName()             : "";
            driverBCin       = d.getCin()              != null ? d.getCin()              : "";
            driverBPhone     = d.getPhoneNumber()      != null ? d.getPhoneNumber()      : "";
            driverBInsurance = d.getInsuranceCompany() != null ? d.getInsuranceCompany() : "";
            driverBPlate     = d.getLicensePlate()     != null ? d.getLicensePlate()     : "";
          }
        }
      }

      result.add(new ConstatSummaryDTO(
        a.getId(),
        a.getAccidentDate().toString(),
        a.getLocation(),
        a.getStatus().name(),
        driverAName, driverACin, driverAPhone, driverAInsurance, driverAPlate,
        driverBName, driverBCin, driverBPhone, driverBInsurance, driverBPlate
      ));
    }

    result.sort((a, b) -> Long.compare(b.getId(), a.getId()));
    return result;
  }
}
