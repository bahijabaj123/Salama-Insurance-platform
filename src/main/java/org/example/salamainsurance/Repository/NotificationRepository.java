package org.example.salamainsurance.Repository;

import org.example.salamainsurance.Entity.Notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
  // Les méthodes seront ajoutées plus tard
}
