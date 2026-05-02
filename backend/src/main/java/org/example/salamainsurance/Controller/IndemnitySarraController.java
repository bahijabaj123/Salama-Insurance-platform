package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.example.salamainsurance.Service.IndemnitySarraService;
import org.example.salamainsurance.Service.PdfGeneratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.util.List;
@CrossOrigin(origins = "http://localhost:63342")
@RestController
@RequestMapping("/api/indemnities")
public class IndemnitySarraController {

    @Autowired
    private IndemnityRepository indemnityRepository;
  @Autowired
  private PdfGeneratorService pdfService;
    @Autowired
    private IndemnitySarraService indemnitySarraService;

  @PostMapping("/{id}/pdf")
  public ResponseEntity<InputStreamResource> downloadPdf(
    @PathVariable Long id,
    @RequestBody String signature) {

    IndemnitySarra indemnity = indemnitySarraService.getById(id)
      .orElseThrow(() -> new RuntimeException("Pas de données"));

    // On passe maintenant la signature au service
    ByteArrayInputStream bis = pdfService.generateIndemnityPdf(indemnity, signature);
    HttpHeaders headers = new HttpHeaders();
    headers.add("Content-Disposition", "attachment; filename=facture_signee.pdf");

    return ResponseEntity.ok()
      .headers(headers)
      .contentType(MediaType.APPLICATION_PDF)
      .body(new InputStreamResource(bis));
  }
    @PostMapping("/calculate")
    public ResponseEntity<IndemnitySarra> calculate(@RequestParam Double gross,
                                                    @RequestParam Integer resp,
                                                    @RequestParam Double fixedDed) {

        IndemnitySarra result = indemnitySarraService.calculateAndSave(gross, resp, fixedDed);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public List<IndemnitySarra> getAllIndemnities() {

        return indemnitySarraService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<IndemnitySarra> getIndemnityById(@PathVariable Long id) {
        return indemnitySarraService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IndemnitySarra> updateStatus(@PathVariable Long id, @RequestParam SettlementStatus status) {
        return indemnityRepository.findById(id).map(indemnity -> {
            indemnity.setStatus(status);
            return ResponseEntity.ok(indemnityRepository.save(indemnity));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIndemnity(@PathVariable Long id) {
        indemnitySarraService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
