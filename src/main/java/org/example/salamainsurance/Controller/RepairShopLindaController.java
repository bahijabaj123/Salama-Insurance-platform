package org.example.salamainsurance.Controller;

import jakarta.validation.Valid;
import org.example.salamainsurance.DTO.RepairShopLindaRequest;
import org.example.salamainsurance.Entity.RepairShopLinda;
import org.example.salamainsurance.Service.RepairShopLindaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-shops-linda")
public class RepairShopLindaController {

  private final RepairShopLindaService service;

  public RepairShopLindaController(RepairShopLindaService service) {
    this.service = service;
  }

  // CREATE
  @PostMapping
  public ResponseEntity<RepairShopLinda> create(@Valid @RequestBody RepairShopLindaRequest request) {
    RepairShopLinda created = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  // GET BY ID
  @GetMapping("/{id}")
  public ResponseEntity<RepairShopLinda> get(@PathVariable Long id) {
    RepairShopLinda shop = service.getById(id); // doit lancer 404 si non trouvé (voir plus bas)
    return ResponseEntity.ok(shop);
  }

  // GET ALL
  @GetMapping
  public ResponseEntity<List<RepairShopLinda>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  // UPDATE
  @PutMapping("/{id}")
  public ResponseEntity<RepairShopLinda> update(
    @PathVariable Long id,
    @Valid @RequestBody RepairShopLindaRequest request
  ) {
    RepairShopLinda updated = service.update(id, request);
    return ResponseEntity.ok(updated);
  }

  // DELETE
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  // GET PARTNERS
  @GetMapping("/partners")
  public ResponseEntity<List<RepairShopLinda>> getPartners() {
    return ResponseEntity.ok(service.getPartnerShops());
  }
}
