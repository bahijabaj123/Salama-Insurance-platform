package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.Expert.MainOeuvreHassen;
import org.example.salamainsurance.Service.Expert.MainOeuvreHassenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/main-oeuvre")
@CrossOrigin(origins = "*")
public class MainOeuvreHassenController {

    private final MainOeuvreHassenService mainOeuvreService;

    public MainOeuvreHassenController(MainOeuvreHassenService mainOeuvreService) {
        this.mainOeuvreService = mainOeuvreService;
    }

    // CREATE
    @PostMapping("/add")
    public ResponseEntity<MainOeuvreHassen> create(@RequestBody MainOeuvreHassen mainOeuvre) {
        return new ResponseEntity<>(mainOeuvreService.saveMainOeuvre(mainOeuvre), HttpStatus.CREATED);
    }

    // CREATE avec rapportId dans l'URL
    @PostMapping("/add/rapport/{rapportId}")
    public ResponseEntity<MainOeuvreHassen> createWithReport(@PathVariable Integer rapportId,
                                                              @RequestBody MainOeuvreHassen mainOeuvre) {
        ExpertReportHassen report = new ExpertReportHassen();
        report.setIdRapport(rapportId);
        mainOeuvre.setRapportExpertise(report);
        return new ResponseEntity<>(mainOeuvreService.saveMainOeuvre(mainOeuvre), HttpStatus.CREATED);
    }

    // READ ALL
    @GetMapping("/all")
    public ResponseEntity<List<MainOeuvreHassen>> getAll() {
        return ResponseEntity.ok(mainOeuvreService.getAllMainOeuvres());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<MainOeuvreHassen> getById(@PathVariable Integer id) {
        return mainOeuvreService.getMainOeuvreById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ BY RAPPORT ID
    @GetMapping("/rapport/{rapportId}")
    public ResponseEntity<List<MainOeuvreHassen>> getByReportId(@PathVariable Integer rapportId) {
        return ResponseEntity.ok(mainOeuvreService.getMainOeuvresByRapportId(rapportId));
    }

    // UPDATE
    @PutMapping("/update/{id}")
    public ResponseEntity<MainOeuvreHassen> update(@PathVariable Integer id, @RequestBody MainOeuvreHassen mainOeuvre) {
        return mainOeuvreService.getMainOeuvreById(id)
                .map(existing -> {
                    existing.setTypeTravail(mainOeuvre.getTypeTravail());
                    existing.setMontant(mainOeuvre.getMontant());
                    existing.setTauxTva(mainOeuvre.getTauxTva());
                    existing.setDescription(mainOeuvre.getDescription());
                    return ResponseEntity.ok(mainOeuvreService.saveMainOeuvre(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        mainOeuvreService.deleteMainOeuvre(id);
        return ResponseEntity.noContent().build();
    }

    // A13 — MO par Type : GET /api/main-oeuvre/type/TOLERIE
    @GetMapping("/type/{typeTravail}")
    public ResponseEntity<List<MainOeuvreHassen>> getByType(
            @PathVariable MainOeuvreHassen.TypeTravail typeTravail) {
        return ResponseEntity.ok(mainOeuvreService.findByTypeTravail(typeTravail));
    }

    // A14 — Total MO HT d'un rapport
    @GetMapping("/rapport/{rapportId}/total")
    public ResponseEntity<Map<String, Object>> getTotalByReport(@PathVariable Integer rapportId) {
        BigDecimal total = mainOeuvreService.getTotalMontantByRapportId(rapportId);
        long count = mainOeuvreService.countByRapportId(rapportId);
        return ResponseEntity.ok(Map.of(
                "rapportId", rapportId,
                "nombreLignes", count,
                "totalMainOeuvreHT", total
        ));
    }

    // A15 — Résumé financier MO complet
    @GetMapping("/rapport/{rapportId}/resume")
    public ResponseEntity<Map<String, Object>> getFinancialSummary(@PathVariable Integer rapportId) {
        return ResponseEntity.ok(mainOeuvreService.getResumeFinancierRapport(rapportId));
    }

    // A16 — Stats globales par type de travail
    @GetMapping("/statistiques/types")
    public ResponseEntity<Map<String, Object>> getStatsByWorkType() {
        return ResponseEntity.ok(mainOeuvreService.getStatsParTypeTravail());
    }
}
