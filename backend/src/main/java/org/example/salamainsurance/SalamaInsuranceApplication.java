package org.example.salamainsurance;

import org.example.salamainsurance.Service.IndemnitySarraService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class SalamaInsuranceApplication {

  public static void main(String[] args) {
    // 1. Démarrage de l'application Spring et récupération du contexte
    ConfigurableApplicationContext context = SpringApplication.run(SalamaInsuranceApplication.class, args);

    System.out.println("\n🚀 Application Salama Insurance lancée avec succès !");

    // 2. APPEL DU TEST (C'est cette ligne qui te manquait)
    testIndemnityCalculation(context);
  }

  /**
   * Méthode de test pour valider le module d'indemnisation avec l'IA
   * Utile pour le rapport du Sprint 1 (Chapitre 7)
   */
  private static void testIndemnityCalculation(ConfigurableApplicationContext context) {
    try {
      // Récupération du service d'indemnisation
      IndemnitySarraService indemnityService = context.getBean(IndemnitySarraService.class);

      System.out.println("\n" + "=".repeat(40));
      System.out.println("   TEST DU CALCUL D'INDEMNITÉ IA (SARRA)");
      System.out.println("=".repeat(40));

      // SCÉNARIO : Client en colère (Sentiment Négatif détecté par Naive Bayes)
      String texteSinistre = "Ma voiture est totalement détruite, je suis très en colère par ce délai !";
      double dommages = 5000.0;
      double franchise = 400.0;

      // Appel de la logique métier (Analyse Sentiment + Calcul Remise + Facture)
      String resultat = indemnityService.genererFactureSeule(texteSinistre, dommages, franchise);

      System.out.println(resultat);
      System.out.println("=".repeat(40));

    } catch (Exception e) {
      System.err.println("⚠️ Erreur lors de l'exécution du test : " + e.getMessage());
      // Si le bean n'existe pas encore ou si le service est mal injecté
    }
  }
}
