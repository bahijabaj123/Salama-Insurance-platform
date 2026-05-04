package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.Device;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByUser_IdAndDeviceId(Long userId, String deviceId);

    List<Device> findByUser_IdOrderByLastLoginAtDesc(Long userId);
}
