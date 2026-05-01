package org.example.salamainsurance.Controller.Report;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.DTO.*;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.AccidentStatus;
import org.example.salamainsurance.Repository.Report.AccidentRepository;
import org.example.salamainsurance.Service.Report.AccidentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/accidents")
@RequiredArgsConstructor
public class AccidentController {

  private final AccidentService accidentService;

  private final AccidentRepository accidentRepository;

  // CREATE
  @PostMapping
  public ResponseEntity<Accident> createAccident(@RequestBody Accident accident) {
    return ResponseEntity.ok(accidentService.saveAccident(accident));
  }

  // READ ALL
  @GetMapping
  public List<Accident> getAllAccidents() {
    return accidentService.getAllAccidents();
  }

  // READ BY ID
  @GetMapping("/{id}")
  public ResponseEntity<Accident> getAccident(@PathVariable Long id) {
    Accident accident = accidentService.getAccidentById(id);
    return ResponseEntity.ok(accident);
  }

  // UPDATE
  @PutMapping("/{id}")
  public ResponseEntity<Accident> updateAccident(@PathVariable Long id,
                                                 @RequestBody Accident accidentDetails) {
    return ResponseEntity.ok(accidentService.updateAccident(id, accidentDetails));
  }

  // DELETE
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteAccident(@PathVariable Long id) {
    accidentService.deleteAccident(id);
    return ResponseEntity.noContent().build();
  }
  @GetMapping("/recent")
  public ResponseEntity<List<ConstatSummaryDTO>> getRecentConstats() {
    return ResponseEntity.ok(accidentService.getRecentConstats());
  }

  @PutMapping("/{id}/rejeter")
  public ResponseEntity<String> rejeter(@PathVariable Long id) {
    accidentService.changeStatus(id, AccidentStatus.REJETE);
    return ResponseEntity.ok("Accident rejeté");
  }

  // LISTE ADMIN : TOUS LES ACCIDENTS
  @GetMapping("/admin/all")
  public ResponseEntity<List<Accident>> getAllForAdmin() {
    return ResponseEntity.ok(accidentService.getAllAccidents());
  }

  // FILTRAGE PAR STATUT
  @GetMapping("/admin/status/{status}")
  public ResponseEntity<List<Accident>> getByStatus(@PathVariable AccidentStatus status) {
    return ResponseEntity.ok(accidentService.getAccidentsByStatus(status));
  }

  // VALIDER UN ACCIDENT
  @PutMapping("/admin/{id}/valider")
  public ResponseEntity<Accident> validerAccident(@PathVariable Long id) {
    Accident accident = accidentService.changeStatus(id, AccidentStatus.VALIDE);
    return ResponseEntity.ok(accident);
  }

  // REJETER UN ACCIDENT
  @PutMapping("/admin/{id}/rejeter")
  public ResponseEntity<Accident> rejeterAccident(@PathVariable Long id) {
    Accident accident = accidentService.changeStatus(id, AccidentStatus.REJETE);
    return ResponseEntity.ok(accident);
  }

  @GetMapping("/admin/table")
  public ResponseEntity<List<Accident>> getAccidentsTable() {
    List<Accident> accidents = accidentService.getAll();
    return ResponseEntity.ok(accidents);
  }

  @GetMapping("/admin/table/status/{status}")
  public ResponseEntity<List<Accident>> getAccidentsTableByStatus(@PathVariable AccidentStatus status) {
    List<Accident> accidents = accidentService.getAccidentsByStatus(status);
    return ResponseEntity.ok(accidents);
  }

  @GetMapping("/{id}/responsibility")
  public ResponseEntity<ResponsibilityResult> calculateResponsibility(
    @PathVariable Long id) {

    return ResponseEntity.ok(
      accidentService.calculateResponsibility(id)
    );
  }

  @PutMapping("/{id}/validate")
  public ResponseEntity<String> validate(@PathVariable Long id) {

    accidentService.validateAccident(id);

    return ResponseEntity.ok("Accident validé + PDF généré");
  }

  @GetMapping("/{id}/pdf")
  public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) {
    try {
      Path filePath = Paths.get("pdf_reports/accident_" + id + ".pdf");
      Resource resource = new UrlResource(filePath.toUri());
      if (resource.exists() || resource.isReadable()) {
        return ResponseEntity.ok()
          .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"accident_" + id + ".pdf\"")
          .body(resource);
      } else {
        return ResponseEntity.notFound().build();
      }
    } catch (MalformedURLException e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @PostMapping("/constats")
  public ResponseEntity<Accident> createConstat(@RequestBody ConstatRequest request) {
    Accident saved = accidentService.createConstatFromRequest(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }

  @PostMapping("/damages")
  public ResponseEntity<?> saveDamages(@RequestBody List<DamageRequest> damages,
                                       @RequestParam Long accidentId) {
    accidentService.saveDamages(accidentId, damages);
    return ResponseEntity.ok().build();
  }

  @GetMapping("/stats")
  public ResponseEntity<StatsDTO> getStats() {
    return ResponseEntity.ok(accidentService.getStats());
  }


}
