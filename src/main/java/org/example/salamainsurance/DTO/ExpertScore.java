package org.example.salamainsurance.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ExpertScore {
  private Long expertId;
  private String expertName;
  private Double score;
  private List<String> matchReasons;
}
