package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Service.Expert.ExpertHassenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experts")
public class ExpertHassenController {

    private final ExpertHassenService expertService;

    public ExpertHassenController(ExpertHassenService expertService) {
        this.expertService = expertService;
    }

    @PostMapping("/add")
    public ExpertHassen create(@Valid @RequestBody ExpertHassen expert) {
        return expertService.createExpert(expert);
    }

    @GetMapping("/all")
    public List<ExpertHassen> getAll() {
        return expertService.getAllExperts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpertHassen> getById(@PathVariable Integer id) {
        ExpertHassen expert = expertService.getExpertById(id);
        return expert != null ? ResponseEntity.ok(expert) : ResponseEntity.notFound().build();
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ExpertHassen> update(@PathVariable Integer id, @Valid @RequestBody ExpertHassen expert) {
        ExpertHassen updated = expertService.updateExpert(id, expert);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        expertService.deleteExpert(id);
        return ResponseEntity.noContent().build();
    }
}
