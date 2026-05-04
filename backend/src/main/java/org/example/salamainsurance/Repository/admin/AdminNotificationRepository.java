package org.example.salamainsurance.Repository.admin;

import org.example.salamainsurance.Entity.admin.AdminNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, Long> {

    /**
     * Newest first. The {@code OrderBy} clause is part of the derived method
     * name so callers may pass an unsorted {@link Pageable} and still get a
     * deterministic ordering.
     */
    Page<AdminNotification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AdminNotification> findByReadFalseOrderByCreatedAtDesc(Pageable pageable);

    long countByReadFalse();

    @Modifying
    @Query("update AdminNotification n set n.read = true where n.read = false")
    int markAllAsRead();
}
