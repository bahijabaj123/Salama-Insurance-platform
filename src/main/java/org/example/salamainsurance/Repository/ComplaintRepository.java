package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.ComplaintSarra;
import org.example.salamainsurance.Entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository

public interface ComplaintRepository extends JpaRepository<ComplaintSarra,Long> {

    List<ComplaintSarra> findByIndemnityIdIndemnity(Long id);

    List<ComplaintSarra> findByDetectedSentiment(String sentiment);

    List<ComplaintSarra> findByPriority(String priority);

    List<ComplaintSarra> findByStatus(ComplaintStatus status);
}
