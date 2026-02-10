package org.example.salamainsurance.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity

public class ClaimStatusBahija {
  @Id
  private int idClaimStatus;

  public void setId(int  id) {
    this.idClaimStatus = id;
  }

  public int getId() {
    return idClaimStatus;
  }
}
