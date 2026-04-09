package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Service.ComplaintSarraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*") // Pour permettre les requêtes depuis votre frontend
public class ComplaintController {

  @Autowired
  private ComplaintSarraService complaintSarraService;

  // Test direct du texte (IA seule)
  @PostMapping("/test-ai")
  public ResponseEntity<ComplaintSarra> testAi(@RequestBody String text) {
    try {
      ComplaintSarra complaint = complaintSarraService.createComplaint(text);
      return ResponseEntity.ok(complaint);
    } catch (Exception e) {
      return ResponseEntity.badRequest().build();
    }
  }


  @PostMapping("/add")
  public ResponseEntity<ComplaintSarra> create(@RequestBody ComplaintSarra complaint) {
    try {
      ComplaintSarra saved = complaintSarraService.createComplaint(complaint.getDescription());
      return ResponseEntity.ok(saved);
    } catch (Exception e) {
      return ResponseEntity.badRequest().build();
    }
  }

  @GetMapping("/all")
  public List<ComplaintSarra> getAll() {
    return complaintSarraService.getAllComplaints();
  }

  @GetMapping("/{id}")
  public ResponseEntity<ComplaintSarra> getById(@PathVariable Long id) {
    ComplaintSarra complaint = complaintSarraService.getComplaintById(id);
    return complaint != null ? ResponseEntity.ok(complaint) : ResponseEntity.notFound().build();
  }

  @PutMapping("/update/{id}")
  public ResponseEntity<ComplaintSarra> update(@PathVariable Long id, @RequestBody ComplaintSarra details) {
    ComplaintSarra updated = complaintSarraService.updateComplaint(id, details);
    return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
  }

  @DeleteMapping("/delete/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    complaintSarraService.deleteComplaint(id);
    return ResponseEntity.noContent().build();
  }
}
