package org.example.salamainsurance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SalamaInsuranceApplication {

  public static void main(String[] args) {
    SpringApplication.run(SalamaInsuranceApplication.class, args);
  }

}
