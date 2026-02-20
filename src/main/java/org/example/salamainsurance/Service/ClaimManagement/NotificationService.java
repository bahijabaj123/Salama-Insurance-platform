package org.example.salamainsurance.Service.ClaimManagement;

import org.example.salamainsurance.Entity.ClaimManagement.Expert;
import org.example.salamainsurance.Entity.ClaimManagement.Insurer;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

  public void sendToExpert(Expert expert, String message) {
    // Implement email/SMS/push notification
    System.out.println("📧 NOTIFICATION TO EXPERT " + expert.getEmail() + ": " + message);

    // Here you would integrate with:
    // - Email service (JavaMailSender)
    // - SMS service (Twilio, etc.)
    // - Push notifications (Firebase)
  }

  public void sendToInsurer(Insurer insurer, String message) {
    System.out.println("📧 NOTIFICATION TO INSURER " + insurer.getEmail() + ": " + message);
  }

  public void sendToDriver(String driverEmail, String message) {
    System.out.println("📧 NOTIFICATION TO DRIVER " + driverEmail + ": " + message);
  }
}
