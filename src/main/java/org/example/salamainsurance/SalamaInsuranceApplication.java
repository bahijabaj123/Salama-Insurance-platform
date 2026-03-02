package org.example.salamainsurance;


import jakarta.activation.DataHandler;
import org.example.salamainsurance.Service.IndemnitySarraService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;

import org.example.salamainsurance.Entity.IndemnitySarra;
import org.example.salamainsurance.Service.IndemnitySarraService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;


@SpringBootApplication
public class SalamaInsuranceApplication {
  public static void main(String[] args) {
    ConfigurableApplicationContext context = SpringApplication.run(SalamaInsuranceApplication.class, args);

    System.out.println("🚀 Application Salama Insurance lancée avec succès !");
  }

}
