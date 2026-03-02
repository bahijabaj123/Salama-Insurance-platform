package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.example.salamainsurance.Repository.IndemnityRepository;
import org.example.salamainsurance.Service.IndemnitySarraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/indemnities")
public class IndemnitySarraController {
/*
    @Autowired
    private IndemnityRepository indemnityRepository;


    @Autowired
    private IndemnitySarraService indemnitySarraService;

    @PostMapping("/validate-payout/{id}")
    public ResponseEntity<IndemnitySarra> validate(
            @PathVariable Long id,
            @RequestParam Double marketValue,
            @RequestParam Double insuredValue) {

        return ResponseEntity.ok(indemnitySarraService.calculateAdvancedPayout(id, marketValue, insuredValue));
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
    @PostMapping("/tester-facture")
    public String testerFacture(@RequestBody String text) {
        // 5000 = Dommage, 400 = Franchise
        return indemnitySarraService.genererFactureSeule(text, 5000.0, 400.0);
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
<<<<<<< HEAD
    }*/
}
=======
    }

}
>>>>>>> feature-complaint-sarra
