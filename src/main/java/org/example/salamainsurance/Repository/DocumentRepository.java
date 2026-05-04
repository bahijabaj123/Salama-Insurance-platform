package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

  List<Document> findByClaimId(Long claimId);

  @Query("SELECT d FROM Document d WHERE d.claimId IN (SELECT c.id FROM Claim c WHERE c.client.id = :clientId)")
  List<Document> findByClientId(@Param("clientId") Long clientId);
}
