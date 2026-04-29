package org.example.salamainsurance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SalamaInsuranceApplication {

  public static void main(String[] args) {
    SpringApplication.run(SalamaInsuranceApplication.class, args);
  }

  @Bean
  public com.fasterxml.jackson.databind.ObjectMapper objectMapper() {
    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
    mapper.getFactory().setStreamWriteConstraints(
      com.fasterxml.jackson.core.StreamWriteConstraints.builder()
        .maxNestingDepth(2000)
        .build()
    );
    return mapper;
  }
}
