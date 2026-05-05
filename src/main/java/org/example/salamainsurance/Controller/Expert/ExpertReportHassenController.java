package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Service.Expert.ExpertReportHassenService;
import org.example.salamainsurance.Service.Expert.RapportExpertisePdfService;
import org.springframework.format.annotation.DateTimeFormat;
import org.example.salamainsurance.Entity.Expert.ExpertiseStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports-expertise")
@CrossOrigin(origins = "*")
public class ExpertReportHassenController {

    private final ExpertReportHassenService reportService;
    private final RapportExpertisePdfService pdfService;

    public ExpertReportHassenController(ExpertReportHassenService reportService,
                                        RapportExpertisePdfService pdfService) {
        this.reportService = reportService;
        this.pdfService = pdfService;
    }

    // ===== CRUD DE BASE =====

    // CREATE
    @PostMapping("/expert/{expertId}")
    public ResponseEntity<ExpertReportHassen> create(@PathVariable Integer expertId,
                                                     @RequestBody ExpertReportHassen report) {
        ExpertReportHassen created = reportService.createReport(expertId, report);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // READ ALL
    @GetMapping("/all")
    public ResponseEntity<List<ExpertReportHassen>> getAll() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ExpertReportHassen> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    // READ BY EXPERT
    @GetMapping("/expert/{expertId}")
    public ResponseEntity<List<ExpertReportHassen>> getByExpertId(@PathVariable Integer expertId) {
        return ResponseEntity.ok(reportService.getReportsByExpertId(expertId));
    }

    // UPDATE
    @PutMapping("/update/{id}")
    public ResponseEntity<ExpertReportHassen> update(@PathVariable Integer id,
                                                     @RequestBody ExpertReportHassen report) {
        return ResponseEntity.ok(reportService.updateReport(id, report));
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }

    // ===== MÉTHODES AVANCÉES =====

    // CHANGER STATUT : PATCH /api/rapports-expertise/{id}/statut?nouveauStatut=VALIDE
    @PatchMapping("/{id}/statut")
    public ResponseEntity<ExpertReportHassen> changerStatut(
      @PathVariable Integer id,
      @RequestParam ExpertiseStatus nouveauStatut) {
      return ResponseEntity.ok(reportService.changerStatut(id, nouveauStatut));
    }

    // CALCUL AUTOMATIQUE DES TOTAUX : POST /api/rapports-expertise/{id}/calculer-totaux
    @PostMapping("/{id}/calculer-totaux")
    public ResponseEntity<ExpertReportHassen> calculerTotaux(@PathVariable Integer id) {
        return ResponseEntity.ok(reportService.calculerTotaux(id));
    }

    // RECHERCHE PAR STATUT : GET /api/rapports-expertise/statut/VALIDE
    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<ExpertReportHassen>> getByStatut(
      @PathVariable ExpertiseStatus statut) {
      return ResponseEntity.ok(reportService.findByStatut(statut));
    }


    // RECHERCHE PAR RÉFÉRENCE : GET /api/rapports-expertise/reference/REF-001
    @GetMapping("/reference/{reference}")
    public ResponseEntity<ExpertReportHassen> getByReference(@PathVariable String reference) {
        return ResponseEntity.ok(reportService.findByNumeroReference(reference));
    }

    // RECHERCHE PAR PÉRIODE : GET /api/rapports-expertise/periode?debut=2026-01-01&fin=2026-12-31
    @GetMapping("/periode")
    public ResponseEntity<List<ExpertReportHassen>> getByPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(reportService.findByPeriode(debut, fin));
    }

    // RECHERCHE PAR IMMATRICULATION : GET /api/rapports-expertise/immatriculation/123TU456
    @GetMapping("/immatriculation/{immatriculation}")
    public ResponseEntity<List<ExpertReportHassen>> getByImmatriculation(@PathVariable String immatriculation) {
        return ResponseEntity.ok(reportService.findByImmatriculation(immatriculation));
    }

    // RECHERCHE PAR ASSURANCE : GET /api/rapports-expertise/assurance/STAR
    @GetMapping("/assurance/{assurance}")
    public ResponseEntity<List<ExpertReportHassen>> getByAssurance(@PathVariable String assurance) {
        return ResponseEntity.ok(reportService.findByAssurance(assurance));
    }

    // STATISTIQUES PAR EXPERT : GET /api/rapports-expertise/statistiques/expert/1
    @GetMapping("/statistiques/expert/{expertId}")
    public ResponseEntity<Map<String, Object>> getStatistiquesExpert(@PathVariable Integer expertId) {
        return ResponseEntity.ok(reportService.getStatistiquesExpert(expertId));
    }

    // STATISTIQUES GLOBALES : GET /api/rapports-expertise/statistiques
    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> getStatistiquesGlobales() {
        return ResponseEntity.ok(reportService.getStatistiquesGlobales());
    }

    // PDF RAPPORT : GET /api/rapports-expertise/{id}/pdf
    @GetMapping("/{id}/pdf")
    public ResponseEntity<?> getPdf(@PathVariable Integer id) {
        try {
            byte[] pdf = pdfService.genererPdfRapport(id);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "rapport-expertise-" + id + ".pdf");
            return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("non trouve")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(("{\"erreur\": \"Rapport ID " + id + " introuvable. Créez d'abord le rapport.\"}").getBytes());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(("{\"erreur\": \"Erreur génération PDF: " + e.getMessage() + "\"}").getBytes());
        }
    }
}
