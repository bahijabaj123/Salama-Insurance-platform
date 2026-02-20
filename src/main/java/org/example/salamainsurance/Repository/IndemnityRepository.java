package org.example.salamainsurance.Repository;


import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Entity.SettlementStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IndemnityRepository extends JpaRepository<IndemnitySarra,Long> {



    List<IndemnitySarra> findByStatus(SettlementStatus status);

    List<IndemnitySarra> findByNetAmountGreaterThan(Double amount);
}


