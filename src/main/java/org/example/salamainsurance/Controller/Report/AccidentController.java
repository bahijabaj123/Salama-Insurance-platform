package org.example.salamainsurance.Controller.Report;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Service.Report.AccidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accidents")
@RequiredArgsConstructor
public class AccidentController {

  private final AccidentService accidentService;

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
  public ResponseEntity<Accident> updateAccident(@PathVariable Long id, @RequestBody Accident accidentDetails) {
    return ResponseEntity.ok(accidentService.updateAccident(id, accidentDetails));
  }

  // DELETE
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteAccident(@PathVariable Long id) {
    accidentService.deleteAccident(id);
    return ResponseEntity.noContent().build();
  }
}
