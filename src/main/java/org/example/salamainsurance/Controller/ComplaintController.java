package org.example.salamainsurance.Controller;

/*import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Service.ComplaintSarraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")

public class ComplaintController {

    private final ComplaintSarraService complaintSarraService;

    public ComplaintController(ComplaintSarraService complaintSarraService) {
        this.complaintSarraService = complaintSarraService;
    }

    @PostMapping("/add")
    public ComplaintSarra create(@RequestBody ComplaintSarra complaint) {
        return complaintSarraService.createComplaint(complaint);
    }
    @PostMapping("/add/indemnity/{indemnityId}")
    public ResponseEntity<ComplaintSarra> createWithIndemnity(
            @RequestBody ComplaintSarra complaint,
            @PathVariable Long indemnityId) {
        ComplaintSarra savedComplaint = complaintSarraService.createAndLinkToIndemnity(complaint, indemnityId);
        return ResponseEntity.ok(savedComplaint);
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
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        complaintSarraService.deleteComplaint(id);
        return ResponseEntity.noContent().build();
    }
}

 */
