package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.DommageHassen;
import org.example.salamainsurance.Service.Expert.DommageHassenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dommages")
@CrossOrigin(origins = "*")
public class DommageHassenController {

    private final DommageHassenService dommageService;

    public DommageHassenController(DommageHassenService dommageService) {
        this.dommageService = dommageService;
    }

    // CREATE
    @PostMapping("/add")
    public ResponseEntity<DommageHassen> create(@RequestBody DommageHassen dommage) {
        return new ResponseEntity<>(dommageService.saveDommage(dommage), HttpStatus.CREATED);
    }

    // READ ALL
    @GetMapping("/all")
    public ResponseEntity<List<DommageHassen>> getAll() {
        return ResponseEntity.ok(dommageService.getAllDommages());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<DommageHassen> getById(@PathVariable Integer id) {
        return dommageService.getDommageById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ BY RAPPORT ID
    @GetMapping("/rapport/{rapportId}")
    public ResponseEntity<List<DommageHassen>> getByRapportId(@PathVariable Integer rapportId) {
        return ResponseEntity.ok(dommageService.getDommagesByRapportId(rapportId));
    }

    // UPDATE
    @PutMapping("/update/{id}")
    public ResponseEntity<DommageHassen> update(@PathVariable Integer id, @RequestBody DommageHassen dommage) {
        return dommageService.getDommageById(id)
                .map(existing -> {
                    existing.setDesignation(dommage.getDesignation());
                    existing.setPointChoc(dommage.getPointChoc());
                    existing.setMontant(dommage.getMontant());
                    existing.setTauxTva(dommage.getTauxTva());
                    existing.setEstOccasion(dommage.getEstOccasion());
                    existing.setQuantite(dommage.getQuantite());
                    return ResponseEntity.ok(dommageService.saveDommage(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        dommageService.deleteDommage(id);
        return ResponseEntity.noContent().build();
    }

    // A7 — Recherche par mot-clé
    @GetMapping("/search")
    public ResponseEntity<List<DommageHassen>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(dommageService.findByDesignation(keyword));
    }

    // A8 — Dommages par point de choc
    @GetMapping("/point-choc/{pointChoc}")
    public ResponseEntity<List<DommageHassen>> getByPointChoc(@PathVariable String pointChoc) {
        return ResponseEntity.ok(dommageService.findByPointChoc(pointChoc));
    }

    // A9 — Dommages pièces d'occasion
    @GetMapping("/occasion")
    public ResponseEntity<List<DommageHassen>> getByOccasion(@RequestParam Boolean estOccasion) {
        return ResponseEntity.ok(dommageService.findByEstOccasion(estOccasion));
    }

    // A10 — Total fournitures HT
    @GetMapping("/rapport/{rapportId}/total")
    public ResponseEntity<Map<String, Object>> getTotalByRapport(@PathVariable Integer rapportId) {
        BigDecimal total = dommageService.getTotalMontantByRapportId(rapportId);
        long count = dommageService.countByRapportId(rapportId);
        return ResponseEntity.ok(Map.of(
                "rapportId", rapportId,
                "nombreDommages", count,
                "totalFournituresHT", total
        ));
    }

    // A11 — Stats financières dommages
    @GetMapping("/rapport/{rapportId}/stats")
    public ResponseEntity<Map<String, Object>> getStats(@PathVariable Integer rapportId) {
        return ResponseEntity.ok(dommageService.getStatsDommagesRapport(rapportId));
    }

    // A12 — Dommages au-dessus d'un seuil
    @GetMapping("/seuil")
    public ResponseEntity<List<DommageHassen>> getBySeuil(@RequestParam BigDecimal montant) {
        return ResponseEntity.ok(dommageService.findByMontantSeuil(montant));
    }
}
