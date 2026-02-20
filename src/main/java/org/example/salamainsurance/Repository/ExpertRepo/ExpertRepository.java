package org.example.salamainsurance.Repository.ExpertRepo;

import org.example.salamainsurance.Entity.ExpertManagement.Expert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExpertRepository extends JpaRepository<Expert, Long> {

  Expert findByEmail(String email);

  // Find available experts by region, sorted by performance and workload
  @Query("SELECT e FROM Expert e WHERE e.region = :region AND e.available = true " +
    "ORDER BY e.performanceScore DESC, e.activeClaims ASC")
  List<Expert> findAvailableExpertsByRegion(@Param("region") String region);

  // Advanced scoring for best expert assignment
  @Query("SELECT e FROM Expert e WHERE e.region = :region AND e.available = true " +
    "ORDER BY (e.performanceScore * 0.4 + (100 - e.activeClaims * 10) * 0.3 + " +
    "CASE WHEN e.averageProcessingTime IS NULL THEN 50 ELSE (100 - e.averageProcessingTime) * 0.3 END) DESC")
  List<Expert> findBestExpertsForAssignment(@Param("region") String region);
}
