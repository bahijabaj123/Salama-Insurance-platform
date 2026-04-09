// Controller/Test/PatternTestController.java
package org.example.salamainsurance.Controller.Test;

import org.example.salamainsurance.Service.Fraud.PatternDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class PatternTestController {

  @Autowired
  private PatternDetectionService patternDetectionService;

  @GetMapping("/patterns")
  public ResponseEntity<String> testPatterns() {
    patternDetectionService.runManualDetection();
    return ResponseEntity.ok(" Détection de patterns lancée - Vérifie les logs IntelliJ !");
  }
}
