package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.Expert.PieceJointeHassen;
import org.example.salamainsurance.Service.Expert.PieceJointeHassenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pieces-jointes")
@CrossOrigin(origins = "*")
public class PieceJointeHassenController {

    private final PieceJointeHassenService pieceJointeService;

    public PieceJointeHassenController(PieceJointeHassenService pieceJointeService) {
        this.pieceJointeService = pieceJointeService;
    }

    // CREATE
    @PostMapping("/add")
    public ResponseEntity<PieceJointeHassen> create(@RequestBody PieceJointeHassen pieceJointe) {
        return new ResponseEntity<>(pieceJointeService.savePieceJointe(pieceJointe), HttpStatus.CREATED);
    }

    // CREATE avec rapportId dans l'URL
    @PostMapping("/add/rapport/{rapportId}")
    public ResponseEntity<PieceJointeHassen> createWithReport(@PathVariable Integer rapportId,
                                                               @RequestBody PieceJointeHassen pieceJointe) {
        ExpertReportHassen report = new ExpertReportHassen();
        report.setIdRapport(rapportId);
        pieceJointe.setRapportExpertise(report);
        return new ResponseEntity<>(pieceJointeService.savePieceJointe(pieceJointe), HttpStatus.CREATED);
    }

    // READ ALL
    @GetMapping("/all")
    public ResponseEntity<List<PieceJointeHassen>> getAll() {
        return ResponseEntity.ok(pieceJointeService.getAllPiecesJointes());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ResponseEntity<PieceJointeHassen> getById(@PathVariable Integer id) {
        return pieceJointeService.getPieceJointeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // READ BY RAPPORT ID
    @GetMapping("/rapport/{rapportId}")
    public ResponseEntity<List<PieceJointeHassen>> getByReportId(@PathVariable Integer rapportId) {
        return ResponseEntity.ok(pieceJointeService.getPiecesJointesByRapportId(rapportId));
    }

    // UPDATE
    @PutMapping("/update/{id}")
    public ResponseEntity<PieceJointeHassen> update(@PathVariable Integer id, @RequestBody PieceJointeHassen pieceJointe) {
        return pieceJointeService.getPieceJointeById(id)
                .map(existing -> {
                    existing.setTypeDocument(pieceJointe.getTypeDocument());
                    existing.setNombre(pieceJointe.getNombre());
                    existing.setCheminFichier(pieceJointe.getCheminFichier());
                    existing.setNomFichier(pieceJointe.getNomFichier());
                    existing.setDescription(pieceJointe.getDescription());
                    return ResponseEntity.ok(pieceJointeService.savePieceJointe(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        pieceJointeService.deletePieceJointe(id);
        return ResponseEntity.noContent().build();
    }
}
