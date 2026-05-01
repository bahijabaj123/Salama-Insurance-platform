package org.example.salamainsurance.Service.Report;

import com.itextpdf.signatures.IExternalDigest;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;

public class ExternalDigest implements IExternalDigest {
  @Override
  public MessageDigest getMessageDigest(String s) throws GeneralSecurityException {
    return null;
  }
}
