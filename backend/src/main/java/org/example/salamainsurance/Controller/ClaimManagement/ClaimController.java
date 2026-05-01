package org.example.salamainsurance.Controller.ClaimManagement;

import org.example.salamainsurance.DTO.ClaimResponseDTO;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.ClaimManagement.ClaimStatus;
import org.example.salamainsurance.Service.ClaimManagement.ClaimService;
import org.example.salamainsurance.Service.ClaimManagement.ClaimServiceImpl;
import org.example.salamainsurance.Service.ClaimManagement.IntelligentExpertAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimController {

  @Autowired
  private ClaimService claimService;

  @Autowired
  private ClaimServiceImpl claimServices;

  @Autowired
  private IntelligentExpertAssignmentService intelligentAssignmentService;

  // ========== CREATE ==========

  @PostMapping("/create-from-accident/{accidentId}")
  public ResponseEntity<?> createClaimFromAccident(
    @PathVariable Long accidentId,
    @RequestParam Long insurerId) {
    try {
      Claim claim = claimService.createClaimFromAccident(accidentId, insurerId);
      return new ResponseEntity<>(claim, HttpStatus.CREATED);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @PostMapping("/batch")
  public ResponseEntity<?> createClaimsBatch(
    @RequestBody List<Long> accidentIds,
    @RequestParam Long insurerId) {
    try {
      List<Claim> claims = claimService.createClaimsBatch(accidentIds, insurerId);
      return new ResponseEntity<>(claims, HttpStatus.CREATED);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // ========== READ ==========

  @GetMapping("/{id}")
  public ResponseEntity<?> getClaimById(@PathVariable Long id) {
    try {
      Claim claim = claimService.getClaimById(id);

      // ⭐ Créer un DTO qui inclut l'expert
      Map<String, Object> response = new HashMap<>();
      response.put("id", claim.getId());
      response.put("reference", claim.getReference());
      response.put("status", claim.getStatus());
      response.put("region", claim.getRegion());
      response.put("openingDate", claim.getOpeningDate());
      response.put("assignedDate", claim.getAssignedDate());
      response.put("closingDate", claim.getClosingDate());
      response.put("lastModifiedDate", claim.getLastModifiedDate());
      response.put("notes", claim.getNotes());
      response.put("urgencyScore", claim.getUrgencyScore());

      // ⭐ Inclure l'expert s'il existe
      if (claim.getExpert() != null) {
        Map<String, Object> expertMap = new HashMap<>();
        expertMap.put("idExpert", claim.getExpert().getIdExpert());
        expertMap.put("firstName", claim.getExpert().getFirstName());
        expertMap.put("lastName", claim.getExpert().getLastName());
        expertMap.put("email", claim.getExpert().getEmail());
        expertMap.put("phone", claim.getExpert().getPhone());
        expertMap.put("specialty", claim.getExpert().getSpecialty());
        expertMap.put("interventionZone", claim.getExpert().getInterventionZone());
        expertMap.put("performanceScore", claim.getExpert().getPerformanceScore());
        expertMap.put("activeClaims", claim.getExpert().getActiveClaims());
        expertMap.put("yearsOfExperience", claim.getExpert().getYearsOfExperience());
        response.put("expert", expertMap);
      }

      // Inclure l'accident si besoin
      if (claim.getAccident() != null) {
        response.put("accident", claim.getAccident());
      }

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }
  }


  @GetMapping("/reference/{reference}")
  public ResponseEntity<?> getClaimByReference(@PathVariable String reference) {
    try {
      Claim claim = claimService.getClaimByReference(reference);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }
  }

  @GetMapping
  public ResponseEntity<List<Claim>> getAllClaims() {
    return ResponseEntity.ok(claimService.getAllClaims());
  }

  @GetMapping("/paginated")
  public ResponseEntity<Page<Claim>> getAllClaimsPaginated(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "10") int size,
    @RequestParam(defaultValue = "id") String sortBy,
    @RequestParam(defaultValue = "DESC") String sortDirection) {

    Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
    Pageable pageable = PageRequest.of(page, size, sort);

    return ResponseEntity.ok(claimService.getAllClaimsPaginated(pageable));
  }

  // ========== UPDATE ==========

  @PutMapping("/{id}")
  public ResponseEntity<?> updateClaim(@PathVariable Long id, @RequestBody Claim claimDetails) {
    try {
      Claim updatedClaim = claimService.updateClaim(id, claimDetails);
      return ResponseEntity.ok(updatedClaim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // ========== DELETE ==========

  @DeleteMapping("/{id}")
  public ResponseEntity<?> deleteClaim(@PathVariable Long id) {
    try {
      claimService.deleteClaim(id);
      return ResponseEntity.ok("Claim deleted successfully");
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @DeleteMapping("/reference/{reference}")
  public ResponseEntity<?> deleteClaimByReference(@PathVariable String reference) {
    try {
      claimService.deleteClaimByReference(reference);
      return ResponseEntity.ok("Claim deleted successfully");
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @DeleteMapping("/batch")
  public ResponseEntity<?> deleteClaimsBatch(@RequestBody List<Long> claimIds) {
    try {
      claimService.deleteClaimsBatch(claimIds);
      return ResponseEntity.ok("Claims deleted successfully");
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // ========== EXPERT ASSIGNMENT ==========

  @PostMapping("/{claimId}/assign-expert/{expertId}")
  public ResponseEntity<?> assignExpert(
    @PathVariable Long claimId,
    @PathVariable Long expertId) {
    try {
      Claim claim = claimService.assignExpertToClaim(claimId, expertId);

      // Convertir en DTO
      ClaimResponseDTO response = new ClaimResponseDTO();
      response.setId(claim.getId());
      response.setReference(claim.getReference());
      response.setStatus(claim.getStatus().toString());
      response.setRegion(claim.getRegion());
      response.setOpeningDate(claim.getOpeningDate());
      response.setAssignedDate(claim.getAssignedDate());
      response.setNotes(claim.getNotes());

      if (claim.getExpert() != null) {
        ClaimResponseDTO.ExpertSummaryDTO expertDTO = new ClaimResponseDTO.ExpertSummaryDTO();
        expertDTO.setId(Long.valueOf(claim.getExpert().getIdExpert()));
        expertDTO.setName(claim.getExpert().getFirstName() + " " + claim.getExpert().getLastName());
        expertDTO.setSpeciality(claim.getExpert().getSpecialty());
        response.setExpert(expertDTO);
      }

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @PostMapping("/{claimId}/auto-assign-expert")
  public ResponseEntity<?> autoAssignExpert(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.autoAssignExpert(claimId);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @PostMapping("/{claimId}/unassign-expert")
  public ResponseEntity<?> unassignExpert(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.unassignExpert(claimId);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @GetMapping("/{claimId}/assignment-details")
  public ResponseEntity<?> getAssignmentDetails(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.getClaimById(claimId);

      Map<String, Object> response = new HashMap<>();
      response.put("claimId", claimId);
      response.put("claimReference", claim.getReference());
      response.put("status", claim.getStatus());

      if (claim.getExpert() != null) {
        Map<String, Object> expertMap = new HashMap<>();
        expertMap.put("id", Long.valueOf(claim.getExpert().getIdExpert()));
        expertMap.put("name", claim.getExpert().getFirstName() + " " + claim.getExpert().getLastName());
        expertMap.put("speciality", claim.getExpert().getSpecialty());
        expertMap.put("performanceScore", claim.getExpert().getPerformanceScore());
        response.put("assignedExpert", expertMap);
        response.put("assignedDate", claim.getAssignedDate());
      } else {
        response.put("message", "Aucun expert assigné");
        response.put("suggestion", "Utilisez POST /api/claims/" + claimId + "/auto-assign-expert");
      }

      return ResponseEntity.ok(response);

    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
    }
  }

  // ========== STATUS MANAGEMENT ==========

  @PatchMapping("/{claimId}/status")
  public ResponseEntity<?> updateStatus(
    @PathVariable Long claimId,
    @RequestParam ClaimStatus status) {
    try {
      Claim claim = claimService.updateClaimStatus(claimId, status);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @PatchMapping("/{claimId}/open")
  public ResponseEntity<?> openClaim(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.openClaim(claimId);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @PatchMapping("/{claimId}/close")
  public ResponseEntity<?> closeClaim(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.closeClaim(claimId);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  @PatchMapping("/{claimId}/cancel")
  public ResponseEntity<?> cancelClaim(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.cancelClaim(claimId);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }

  // ========== SEARCH ==========

  @GetMapping("/search")
  public ResponseEntity<List<Claim>> searchClaims(
    @RequestParam(required = false) String reference,
    @RequestParam(required = false) ClaimStatus status,
    @RequestParam(required = false) String region,
    @RequestParam(required = false) Long expertId,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

    List<Claim> claims = claimService.searchClaims(reference, status, region, expertId, startDate, endDate);
    return ResponseEntity.ok(claims);
  }

  @GetMapping("/status/{status}")
  public ResponseEntity<List<Claim>> getClaimsByStatus(@PathVariable ClaimStatus status) {
    return ResponseEntity.ok(claimService.findByStatus(status));
  }

  @GetMapping("/expert/{expertId}")
  public ResponseEntity<List<Claim>> getClaimsByExpert(@PathVariable Integer expertId) {
    return ResponseEntity.ok(claimService.findByExpertId(expertId));
  }

  @GetMapping("/region/{region}")
  public ResponseEntity<List<Claim>> getClaimsByRegion(@PathVariable String region) {
    return ResponseEntity.ok(claimService.findByRegion(region));
  }

  @GetMapping("/date-range")
  public ResponseEntity<List<Claim>> getClaimsByDateRange(
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
    @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
    return ResponseEntity.ok(claimService.findByDateRange(start, end));
  }

  // ========== STATISTICS ==========

  @GetMapping("/statistics")
  public ResponseEntity<Map<String, Object>> getStatistics() {
    return ResponseEntity.ok(claimService.getClaimStatistics());
  }

  @GetMapping("/statistics/by-status")
  public ResponseEntity<Map<String, Object>> getClaimsByStatus() {
    return ResponseEntity.ok(claimService.getClaimsByStatus());
  }

  @GetMapping("/statistics/by-region")
  public ResponseEntity<Map<String, Object>> getClaimsByRegion() {
    return ResponseEntity.ok(claimService.getClaimsByRegion());
  }

  @GetMapping("/count")
  public ResponseEntity<Long> getTotalClaimsCount() {
    return ResponseEntity.ok(claimService.getTotalClaimsCount());
  }

  // ========== SYNC ==========

  @PostMapping("/{claimId}/sync")
  public ResponseEntity<?> syncWithAccident(@PathVariable Long claimId) {
    try {
      Claim claim = claimService.syncWithAccident(claimId);
      return ResponseEntity.ok(claim);
    } catch (Exception e) {
      return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
    }
  }
}
