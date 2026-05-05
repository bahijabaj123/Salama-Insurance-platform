package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.SOSRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SOSRequestRepository extends JpaRepository<SOSRequest, Long> {

    List<SOSRequest> findByType(SOSRequest.SOSType type);
    List<SOSRequest> findByStatus(SOSRequest.SOSStatus status);
}
