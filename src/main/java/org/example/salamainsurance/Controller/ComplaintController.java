package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Service.ComplaintSarraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "http://localhost:4200")
public class ComplaintController {

  @Autowired
  private ComplaintSarraService complaintSarraService;

  // Créer une réclamation (avec analyse automatique)
  @PostMapping("/add")
  public ResponseEntity<ComplaintSarra> create(@RequestBody Map<String, Object> payload) {
    String description = (String) payload.get("description");
    Long claimId = payload.containsKey("claimId") ? ((Number) payload.get("claimId")).longValue() : null;
    if (description == null || description.trim().isEmpty()) {
      return ResponseEntity.badRequest().build();
    }
    ComplaintSarra saved = complaintSarraService.createComplaint(description, claimId);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);
  }
  @DeleteMapping("/bulk-delete")
  public ResponseEntity<Void> bulkDelete(@RequestBody List<Long> ids) {
    complaintSarraService.bulkDelete(ids);
    return ResponseEntity.noContent().build();
  }
  // Récupérer toutes les réclamations
  @GetMapping("/all")
  public List<ComplaintSarra> getAll() {
    return complaintSarraService.getAllComplaints();
  }

  // Récupérer par ID
  @GetMapping("/{id}")
  public ResponseEntity<ComplaintSarra> getById(@PathVariable Long id) {
    ComplaintSarra complaint = complaintSarraService.getComplaintById(id);
    return complaint != null ? ResponseEntity.ok(complaint) : ResponseEntity.notFound().build();
  }

  // Mettre à jour
  @PutMapping("/update/{id}")
  public ResponseEntity<ComplaintSarra> update(@PathVariable Long id, @RequestBody ComplaintSarra details) {
    ComplaintSarra updated = complaintSarraService.updateComplaint(id, details);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  // Mettre à jour le statut
  @PatchMapping("/{id}/status")
  public ResponseEntity<ComplaintSarra> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
    String status = request.get("status");
    ComplaintSarra updated = complaintSarraService.updateStatus(id, status);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  // Supprimer
  @DeleteMapping("/delete/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    complaintSarraService.deleteComplaint(id);
    return ResponseEntity.noContent().build();
  }

  // ===== NOUVEAUX ENDPOINTS =====

  // Répondre à une réclamation (la marque automatiquement comme résolue)
  @PostMapping("/{id}/respond")
  public ResponseEntity<ComplaintSarra> respondToComplaint(
    @PathVariable Long id,
    @RequestBody Map<String, String> request) {
    try {
      String response = request.get("response");
      String respondedBy = request.get("respondedBy");

      if (response == null || response.trim().isEmpty()) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "La réponse est requise");
        return ResponseEntity.badRequest().body(null);
      }

      ComplaintSarra complaint = complaintSarraService.respondToComplaint(id, response, respondedBy);
      return complaint != null ? ResponseEntity.ok(complaint) : ResponseEntity.notFound().build();
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }  // ← FERMETURE CORRECTE de la méthode respondToComplaint

  // Marquer une réclamation comme résolue
  @PatchMapping("/{id}/resolve")
  public ResponseEntity<ComplaintSarra> resolveComplaint(@PathVariable Long id) {
    ComplaintSarra complaint = complaintSarraService.resolveComplaint(id);
    return complaint != null ? ResponseEntity.ok(complaint) : ResponseEntity.notFound().build();
  }
  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> getStats() {
    Map<String, Object> stats = complaintSarraService.getDashboardStats();
    return ResponseEntity.ok(stats);
  }
  // Récupérer uniquement les réclamations en attente
  @GetMapping("/pending")
  public ResponseEntity<List<ComplaintSarra>> getPendingComplaints() {
    List<ComplaintSarra> pending = complaintSarraService.getPendingComplaints();
    return ResponseEntity.ok(pending);
  }
  @GetMapping("/claim/{claimId}")
  public ResponseEntity<List<ComplaintSarra>> getByClaimId(@PathVariable Long claimId) {
    List<ComplaintSarra> complaints = complaintSarraService.getByClaimId(claimId);
    return ResponseEntity.ok(complaints);
  }

  @GetMapping("/check-new")
  public ResponseEntity<Map<String, Object>> checkNewComplaints(@RequestParam Long lastChecked) {
    Map<String, Object> result = complaintSarraService.checkNewComplaints(lastChecked);
    return ResponseEntity.ok(result);
  }
  // Récupérer uniquement les réclamations résolues
  @GetMapping("/resolved")
  public ResponseEntity<List<ComplaintSarra>> getResolvedComplaints() {
    List<ComplaintSarra> resolved = complaintSarraService.getResolvedComplaints();
    return ResponseEntity.ok(resolved);
  }

  // Récupérer la réponse d'une réclamation
  @GetMapping("/{id}/response")
  public ResponseEntity<Map<String, Object>> getResponse(@PathVariable Long id) {
    ComplaintSarra complaint = complaintSarraService.getComplaintById(id);
    if (complaint == null) {
      return ResponseEntity.notFound().build();
    }
    Map<String, Object> response = new HashMap<>();
    response.put("response", complaint.getResponse());
    response.put("responseDate", complaint.getResponseDate());
    response.put("respondedBy", complaint.getRespondedBy());
    response.put("status", complaint.getStatus());

    return ResponseEntity.ok(response);
  }
}
