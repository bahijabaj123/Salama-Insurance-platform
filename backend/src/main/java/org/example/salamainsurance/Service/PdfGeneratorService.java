package org.example.salamainsurance.Service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.springframework.stereotype.Service;
import com.itextpdf.layout.element.Image;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.layout.element.Paragraph;
import java.util.Base64;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;

@Service
public class PdfGeneratorService {

  // On ajoute l'argument signatureBase64 ici
  public ByteArrayInputStream generateIndemnityPdf(IndemnitySarra indemnity, String signatureBase64) {
    ByteArrayOutputStream out = new ByteArrayOutputStream();

    try {
      PdfWriter writer = new PdfWriter(out);
      PdfDocument pdf = new PdfDocument(writer);
      Document document = new Document(pdf);

      // --- En-tête ---
      document.add(new Paragraph("SALAMA INSURANCE")
        .setBold()
        .setFontSize(22)
        .setFontColor(ColorConstants.GREEN)
        .setTextAlignment(TextAlignment.CENTER));

      document.add(new Paragraph("Facture d'Indemnisation Officielle")
        .setItalic()
        .setFontSize(12)
        .setTextAlignment(TextAlignment.CENTER));

      document.add(new Paragraph("\n------------------------------------------------------------------\n"));

      // --- Corps du document ---
      document.add(new Paragraph("Détails du calcul :").setBold().setUnderline());

      Table table = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
      table.setMarginTop(10);

      table.addCell("Référence Dossier :");
      table.addCell(indemnity.getId().toString());

      table.addCell("Date de calcul :");
      table.addCell(indemnity.getCalculationDate().toString());

      table.addCell("Montant Brut des Dommages :");
      table.addCell(String.format("%.2f DT", indemnity.getGrossAmount()));

      table.addCell("Taux de Responsabilité :");
      table.addCell(indemnity.getResponsibility() + "%");

      table.addCell("Franchise appliquée :");
      table.addCell(String.format("%.2f DT", indemnity.getDeductibleValue()));

      document.add(table);

      // --- Résultat Final ---
      document.add(new Paragraph("\n"));
      document.add(new Paragraph("MONTANT NET À LIBÉRER : " + String.format("%.2f", indemnity.getNetAmount()) + " DT")
        .setBold()
        .setFontSize(16)
        .setFontColor(ColorConstants.GREEN)
        .setTextAlignment(TextAlignment.RIGHT));

      // --- NOUVEAU : Bloc Signature ---
      if (signatureBase64 != null && !signatureBase64.isEmpty()) {
        document.add(new Paragraph("\n\n"));
        document.add(new Paragraph("Signature de l'assureur :")
          .setBold()
          .setUnderline()
          .setFontSize(12));

        try {
          // Décodage du Base64 envoyé par le frontend
          byte[] imageBytes = Base64.getDecoder().decode(signatureBase64);
          Image signatureImg = new Image(ImageDataFactory.create(imageBytes));

          // Réglage de la taille (ajustable selon tes besoins)
          signatureImg.setWidth(150);
          document.add(signatureImg);
        } catch (Exception e) {
          document.add(new Paragraph("[Erreur lors du chargement de la signature]"));
        }
      }

      // --- Pied de page ---
      document.add(new Paragraph("\n\n"));
      document.add(new Paragraph("Validé électroniquement par le système d'indemnisation Salama")
        .setFontSize(10)
        .setItalic());
      document.add(new Paragraph("Date d'émission : " + LocalDate.now())
        .setFontSize(10));

      document.close();
    } catch (Exception e) {
      e.printStackTrace();
    }

    return new ByteArrayInputStream(out.toByteArray());
  }
}
