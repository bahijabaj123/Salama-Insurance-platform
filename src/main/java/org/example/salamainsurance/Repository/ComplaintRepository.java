package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

<<<<<<< HEAD
public interface ComplaintRepository extends JpaRepository<ComplaintSarra,Long> {

  // CORRECTION: Utilisez indemnity.idIndemnity au lieu de indemnityId
  List<ComplaintSarra> findByIndemnity_IdIndemnity(Long idIndemnity);
  // OU
  List<ComplaintSarra> findByIndemnityIdIndemnity(Long idIndemnity);
=======

public interface ComplaintRepository extends JpaRepository<ComplaintSarra,Long> {

    List<ComplaintSarra> findByIndemnityId(Long indemnityId);
>>>>>>> 2afc754fccad9612ef2f50ffe6659f379a7758e7

  List<ComplaintSarra> findByDetectedSentiment(String sentiment);

  List<ComplaintSarra> findByPriority(String priority);

  List<ComplaintSarra> findByStatus(ComplaintStatus status);
}
