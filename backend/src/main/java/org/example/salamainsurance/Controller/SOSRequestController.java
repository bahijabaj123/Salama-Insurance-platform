package org.example.salamainsurance.Controller;

import jakarta.validation.Valid;
import org.example.salamainsurance.DTO.SOSRequestRequest;
import org.example.salamainsurance.Entity.SOSRequest;
import org.example.salamainsurance.Service.SOSRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos-requests")
public class SOSRequestController {

  private final SOSRequestService service;

  public SOSRequestController(SOSRequestService service) {
    this.service = service;
  }

  @PostMapping
  public ResponseEntity<SOSRequest> create(@Valid @RequestBody SOSRequestRequest request) {
    SOSRequest created = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/{id}")
  public ResponseEntity<SOSRequest> get(@PathVariable Long id) {
    return ResponseEntity.ok(service.getById(id));
  }

  @GetMapping
  public ResponseEntity<List<SOSRequest>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  @PutMapping("/{id}")
  public ResponseEntity<SOSRequest> update(
    @PathVariable Long id,
    @Valid @RequestBody SOSRequestRequest request
  ) {
    return ResponseEntity.ok(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/by-type")
  public ResponseEntity<List<SOSRequest>> getByType(@RequestParam SOSRequest.SOSType type) {
    return ResponseEntity.ok(service.getByType(type));
  }

  @GetMapping("/by-status")
  public ResponseEntity<List<SOSRequest>> getByStatus(@RequestParam SOSRequest.SOSStatus status) {
    return ResponseEntity.ok(service.getByStatus(status));
  }
}
