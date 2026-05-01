package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.RepairShopLinda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RepairShopLindaRepository extends JpaRepository<RepairShopLinda, Long> {

    List<RepairShopLinda> findByPartnerTrue();

    List<RepairShopLinda> findByCityIgnoreCase(String city);
}
