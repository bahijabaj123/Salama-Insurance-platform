package org.example.salamainsurance.Repository.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Insurer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InsurerRepository extends JpaRepository<Insurer, Long> {

  // Méthode pour trouver le premier assureur
  Insurer findFirstByOrderByIdAsc();
}
