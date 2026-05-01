package org.example.salamainsurance.Repository.Report;

import org.example.salamainsurance.Entity.Report.Damage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DamageRepository extends JpaRepository<Damage, Long> {
}
