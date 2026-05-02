// dto/EmailRequest.java
package org.example.salamainsurance.DTO;

import lombok.Data;

@Data
public class EmailRequest {
  private String to;
  private String claimReference;
  private String status;
  private String message;
  private Integer urgencyScore;
  private String expertName;
}
