package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.ExpertManagement.Expert;
import org.example.salamainsurance.Entity.ExpertManagement.ExpertStatus;
import org.example.salamainsurance.Repository.ExpertRepo.ExpertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/experts")
public class ExpertController {

  @Autowired
  private ExpertRepository expertRepository;

  @GetMapping("/available")
  public ResponseEntity<List<Expert>> getAvailableExperts(
    @RequestParam(required = false) String region) {

    if (region != null && !region.isEmpty()) {
      List<Expert> experts = expertRepository.findByRegionAndStatus(region, ExpertStatus.AVAILABLE);
      return ResponseEntity.ok(experts);
    } else {
      List<Expert> experts = expertRepository.findByStatus(ExpertStatus.AVAILABLE);
      return ResponseEntity.ok(experts);
    }
  }

  @GetMapping("/{id}")
  public ResponseEntity<Expert> getExpertById(@PathVariable Long id) {
    return expertRepository.findById(id)
      .map(ResponseEntity::ok)
      .orElse(ResponseEntity.notFound().build());
  }

  @GetMapping("/statistics")
  public ResponseEntity<Map<String, Object>> getExpertStatistics() {

    List<Expert> allExperts = expertRepository.findAll();

    Map<String, Object> stats = new HashMap<>();

    stats.put("totalExperts", allExperts.size());

    Map<String, Long> statusCount = new HashMap<>();
    statusCount.put("AVAILABLE", allExperts.stream()
      .filter(e -> e.getStatus() == ExpertStatus.AVAILABLE).count());
    statusCount.put("BUSY", allExperts.stream()
      .filter(e -> e.getStatus() == ExpertStatus.BUSY).count());
    statusCount.put("UNAVAILABLE", allExperts.stream()
      .filter(e -> e.getStatus() == ExpertStatus.UNAVAILABLE).count());
    statusCount.put("INACTIVE", allExperts.stream()
      .filter(e -> e.getStatus() == ExpertStatus.INACTIVE).count());
    stats.put("byStatus", statusCount);

    double avgWorkload = allExperts.stream()
      .filter(e -> e.getCurrentWorkload() > 0)
      .mapToInt(Expert::getCurrentWorkload)
      .average()
      .orElse(0.0);
    stats.put("averageWorkload", Math.round(avgWorkload * 10) / 10.0);

    double avgPerformance = allExperts.stream()
      .filter(e -> e.getPerformanceScore() != null)
      .mapToInt(Expert::getPerformanceScore)
      .average()
      .orElse(0.0);
    stats.put("averagePerformanceScore", Math.round(avgPerformance * 10) / 10.0);

    stats.put("availableNow", allExperts.stream()
      .filter(e -> e.getStatus() == ExpertStatus.AVAILABLE).count());

    int totalCapacity = allExperts.stream()
      .filter(e -> e.getMaxWorkload() != null)
      .mapToInt(Expert::getMaxWorkload)
      .sum();

    int totalCurrentWorkload = allExperts.stream()
      .mapToInt(Expert::getCurrentWorkload)
      .sum();

    stats.put("totalCapacity", totalCapacity);
    stats.put("totalCurrentWorkload", totalCurrentWorkload);
    stats.put("utilizationRate", totalCapacity > 0 ?
      Math.round((totalCurrentWorkload * 100.0 / totalCapacity) * 10) / 10.0 : 0);

    Map<String, Long> byRegion = new HashMap<>();
    allExperts.stream()
      .filter(e -> e.getRegion() != null)
      .forEach(e -> byRegion.merge(e.getRegion(), 1L, Long::sum));
    stats.put("byRegion", byRegion);

    long topPerformers = allExperts.stream()
      .filter(e -> e.getPerformanceScore() != null && e.getPerformanceScore() > 90)
      .count();
    stats.put("topPerformers", topPerformers);

    return ResponseEntity.ok(stats);
  }
}
