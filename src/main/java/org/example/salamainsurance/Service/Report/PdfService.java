package org.example.salamainsurance.Service.Report;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.*;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;

@Service
public class PdfService {

  public void generatePdf(Accident accident, ResponsibilityResult result) {

    try {

      String folder = "uploads/constats/";
      new File(folder).mkdirs();

      String path = folder + "accident_" + accident.getId() + ".pdf";

      Document document = new Document();
      PdfWriter.getInstance(document, new FileOutputStream(path));

      document.open();

      document.add(new Paragraph("CONSTAT AMIABLE"));
      document.add(new Paragraph("Date : " + accident.getAccidentDate()));
      document.add(new Paragraph("Lieu : " + accident.getLocation()));

      document.add(new Paragraph(" "));

      for (Driver driver : accident.getDrivers()) {

        document.add(new Paragraph("Conducteur : " + driver.getDriverType()));
        document.add(new Paragraph("Nom : " + driver.getName()));
        document.add(new Paragraph("CIN : " + driver.getCin()));
        document.add(new Paragraph("Voiture : " + driver.getLicensePlate()));

        document.add(new Paragraph(" "));
      }

      document.add(new Paragraph("Responsabilité A : " + result.getDriverAResponsibility()));
      document.add(new Paragraph("Responsabilité B : " + result.getDriverBResponsibility()));
      document.add(new Paragraph(result.getDecision()));

      document.close();

    } catch (Exception e) {
      e.printStackTrace();
    }
  }
}
