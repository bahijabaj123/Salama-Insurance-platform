package org.example.salamainsurance.Controller;

import jakarta.validation.Valid;
import org.example.salamainsurance.DTO.TowTruckRequest;
import org.example.salamainsurance.Entity.TowTruck;
import org.example.salamainsurance.Service.TowTruckService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tow-trucks")
public class TowTruckController {

    private final TowTruckService service;

    public TowTruckController(TowTruckService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TowTruck> create(@Valid @RequestBody TowTruckRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TowTruck> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<TowTruck>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<TowTruck> update(@PathVariable Long id, @Valid @RequestBody TowTruckRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
