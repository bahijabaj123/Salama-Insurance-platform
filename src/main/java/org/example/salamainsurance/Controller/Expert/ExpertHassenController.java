package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;
import org.example.salamainsurance.Service.Expert.ExpertHassenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/experts")
@CrossOrigin(origins = "*")
public class ExpertHassenController {

    private final ExpertHassenService expertService;

    public ExpertHassenController(ExpertHassenService expertService) {
        this.expertService = expertService;
    }

    // CREATE - Ajouter un expert
    @PostMapping("/add")
    public ResponseEntity<ExpertHassen> create(@Valid @RequestBody ExpertHassen expert) {
        return new ResponseEntity<>(expertService.createExpert(expert), HttpStatus.CREATED);
    }

    // READ ALL - Lister tousles experts
    @GetMapping("/all")
    public ResponseEntity<List<ExpertHassen>> getAll() {
        return ResponseEntity.ok(expertService.getAllExperts());
    }

  @GetMapping
  public ResponseEntity<List<ExpertHassen>> getAllExperts() {
    return ResponseEntity.ok(expertService.getAllExperts());
  }

    // READ BY ID - Obtenir un expert par ID
    @GetMapping("/{id}")
    public ResponseEntity<ExpertHassen> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(expertService.getExpertById(id));
    }

    // UPDATE - Modifier un expert
    @PutMapping("/update/{id}")
    public ResponseEntity<ExpertHassen> update(@PathVariable Integer id, @Valid @RequestBody ExpertHassen expert) {
        return ResponseEntity.ok(expertService.updateExpert(id, expert));
    }

    // DELETE - Supprimer un expert
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        expertService.deleteExpert(id);
        return ResponseEntity.noContent().build();
    }

  @GetMapping("/available")
  public ResponseEntity<List<ExpertHassen>> getAvailableExperts() {
    List<ExpertHassen> availableExperts = expertService.findByStatus(ExpertStatus.AVAILABLE);
    return ResponseEntity.ok(availableExperts);
  }

    // SEARCH BY ZONE - Rechercher par zone d'intervention
    @GetMapping("/zone/{zone}")
    public ResponseEntity<List<ExpertHassen>> getByZone(@PathVariable ExpertHassen.InterventionZone zone) {
        return ResponseEntity.ok(expertService.findByInterventionZone(zone));
    }

    // SEARCH BY STATUS - Rechercher par statut
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ExpertHassen>> getByStatus(@PathVariable ExpertStatus status) {
        return ResponseEntity.ok(expertService.findByStatus(status));
    }

    // ===== MÉTHODES AVANCÉES =====

    // RECHERCHE PAR NOM/PRÉNOM : GET /api/experts/search?nom=cherif
    @GetMapping("/search")
    public ResponseEntity<List<ExpertHassen>> searchByName(@RequestParam String nom) {
        return ResponseEntity.ok(expertService.searchByName(nom));
    }

    // RECHERCHE PAR SPÉCIALITÉ : GET /api/experts/specialite/automobile
    @GetMapping("/specialite/{specialty}")
    public ResponseEntity<List<ExpertHassen>> getBySpecialty(@PathVariable String specialty) {
        return ResponseEntity.ok(expertService.findBySpecialty(specialty));
    }

    // RECHERCHE PAR EXPÉRIENCE MINIMUM : GET /api/experts/experience/5
    @GetMapping("/experience/{minYears}")
    public ResponseEntity<List<ExpertHassen>> getByExperience(@PathVariable Integer minYears) {
        return ResponseEntity.ok(expertService.findByExperienceMin(minYears));
    }

    // CHANGER STATUT EXPERT : PATCH /api/experts/{id}/statut?nouveauStatut=INACTIVE
    @PatchMapping("/{id}/statut")
    public ResponseEntity<ExpertHassen> changeStatus(
            @PathVariable Integer id,
            @RequestParam ExpertStatus nouveauStatut) {
        return ResponseEntity.ok(expertService.changeStatus(id, nouveauStatut));
    }

    // STATISTIQUES GLOBALES EXPERTS : GET /api/experts/statistiques
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiques() {
        return ResponseEntity.ok(expertService.getExpertStatistics());
    }
}

