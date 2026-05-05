package org.example.salamainsurance;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

@SpringBootApplication
public class SalamaInsuranceApplication {

  public static void main(String[] args) {
    // 1. Démarrage de l'application Spring et récupération du contexte
    ConfigurableApplicationContext context = SpringApplication.run(SalamaInsuranceApplication.class, args);

    System.out.println("\n🚀 Application Salama Insurance lancée avec succès !");



  }}



