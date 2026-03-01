package org.example.salamainsurance.Controller.Test;

import org.example.salamainsurance.Service.Fraud.PatternDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class PatternTestController {

  @Autowired
  private PatternDetectionService patternDetectionService;

  @GetMapping("/patterns")
  public String testPatterns() {
    patternDetectionService.runManualDetection();
    return "✅ Détection de patterns lancée - Vérifie les logs IntelliJ !";
  }
}
