package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.example.salamainsurance.Service.ComplaintSarraService;
import org.example.salamainsurance.Service.IndemnitySarraService;
import org.example.salamainsurance.Service.PdfGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/indemnities")
public class IndemnitySarraController {

  @Autowired
  private IndemnityRepository indemnityRepository;

  @Autowired
  private PdfGeneratorService pdfService;

  @Autowired
  private IndemnitySarraService indemnitySarraService;

  @Autowired
  private ComplaintSarraService complaintSarraService;

  // --- CALCUL AUTOMATIQUE (POST recommandé) ---
  // J'ai renommé en POST pour respecter les conventions REST
  @PostMapping("/generate/{claimId}")
  public ResponseEntity<?> generateIndemnity(@PathVariable Long claimId) {
    try {
      IndemnitySarra indemnity = indemnitySarraService.genererQuittanceOfficielle(claimId);
      return ResponseEntity.ok(indemnity);
    } catch (RuntimeException e) {
      Map<String, String> error = new HashMap<>();
      error.put("error", e.getMessage());
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    } catch (Exception e) {
      Map<String, String> error = new HashMap<>();
      error.put("error", "Erreur interne: " + e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
  }

  // Endpoint GET pour tester (conservé pour compatibilité, mais POST est préférable)
  @GetMapping("/test-calcul/{claimId}")
  public ResponseEntity<String> testCalcul(@PathVariable Long claimId) {
    try {
      IndemnitySarra indemnity = indemnitySarraService.genererQuittanceOfficielle(claimId);
      return ResponseEntity.ok("Indemnité créée avec ID: " + indemnity.getIdIndemnity());
    } catch (Exception e) {
      return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
    }
  }

  // --- ANALYSE IA SENTIMENT ---
  @PostMapping("/analyser-ia")
  public ResponseEntity<Map<String, String>> analyserSentiment(@RequestBody Map<String, String> request) {
    try {
      String texte = request.get("description");
      if (texte == null || texte.trim().isEmpty()) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Le texte de description est requis");
        return ResponseEntity.badRequest().body(errorResponse);
      }

      String sentiment = complaintSarraService.predictOnly(texte);

      Map<String, String> response = new HashMap<>();
      response.put("sentiment", sentiment);
      response.put("priority", determinePriority(sentiment));

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      Map<String, String> errorResponse = new HashMap<>();
      errorResponse.put("error", e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
  }

  // --- GÉNÉRATION PDF ---
  @PostMapping("/{id}/pdf")
  public ResponseEntity<InputStreamResource> downloadPdf(
    @PathVariable Long id,
    @RequestBody Map<String, String> request) {
    try {
      String signature = request.get("signature");
      if (signature == null) signature = "";

      IndemnitySarra indemnity = indemnitySarraService.getById(id)
        .orElseThrow(() -> new RuntimeException("Indemnité non trouvée avec l'ID: " + id));

      ByteArrayInputStream bis = pdfService.generateIndemnityPdf(indemnity, signature);
      HttpHeaders headers = new HttpHeaders();
      headers.add("Content-Disposition", "attachment; filename=indemnite_" + id + ".pdf");

      return ResponseEntity.ok()
        .headers(headers)
        .contentType(MediaType.APPLICATION_PDF)
        .body(new InputStreamResource(bis));
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  // --- CRUD ---
  @GetMapping
  public ResponseEntity<List<IndemnitySarra>> getAllIndemnities() {
    try {
      List<IndemnitySarra> indemnities = indemnitySarraService.getAll();
      return ResponseEntity.ok(indemnities);
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  @GetMapping("/{id}")
  public ResponseEntity<IndemnitySarra> getIndemnityById(@PathVariable Long id) {
    try {
      return indemnitySarraService.getById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam SettlementStatus status) {
    try {
      return indemnityRepository.findById(id).map(indemnity -> {
        indemnity.setStatus(status);
        IndemnitySarra updated = indemnityRepository.save(indemnity);
        return ResponseEntity.ok(updated);
      }).orElse(ResponseEntity.notFound().build());
    } catch (Exception e) {
      Map<String, String> errorResponse = new HashMap<>();
      errorResponse.put("error", e.getMessage());
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteIndemnity(@PathVariable Long id) {
    try {
      indemnitySarraService.delete(id);
      return ResponseEntity.noContent().build();
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  // Récupération par claimId (utilise le service, pas directement le repository)
  @GetMapping("/claim/{claimId}")
  public ResponseEntity<IndemnitySarra> getByClaimId(@PathVariable Long claimId) {
    try {
      return indemnitySarraService.findByClaimId(claimId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  // --- Méthode utilitaire ---
  private String determinePriority(String sentiment) {
    if (sentiment == null) return "MEDIUM";
    switch (sentiment.toUpperCase()) {
      case "NEGATIVE":
      case "TRES_NEGATIVE":
        return "HIGH";
      case "POSITIVE":
      case "TRES_POSITIVE":
        return "LOW";
      case "NEUTRAL":
        return "MEDIUM";
      default:
        return "MEDIUM";
    }
  }
}
