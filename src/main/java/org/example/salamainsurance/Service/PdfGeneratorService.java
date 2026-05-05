package org.example.salamainsurance.Service;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.element.Image;
import com.itextpdf.io.image.ImageDataFactory;
import org.example.salamainsurance.Entity.IndemnitySarra;
import org.springframework.stereotype.Service;


import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
public class PdfGeneratorService {

  public ByteArrayInputStream generateIndemnityPdf(IndemnitySarra indemnity, String signatureBase64) {
    ByteArrayOutputStream out = new ByteArrayOutputStream();

    try {
      PdfWriter writer = new PdfWriter(out);
      PdfDocument pdf = new PdfDocument(writer);
      Document document = new Document(pdf);
      document.setMargins(36, 36, 36, 36);

      // === Polices modernes Helvetica ===

      PdfFont normalFont = PdfFontFactory.createFont("Helvetica");
      PdfFont boldFont = PdfFontFactory.createFont("Helvetica-Bold");

      // ========== EN-TÊTE BLEU ==========
      Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1}))
        .useAllAvailableWidth()
        .setBackgroundColor(ColorConstants.BLUE)
        .setBorder(null);
      Cell headerCell = new Cell()
        .add(new Paragraph("SALAMA INSURANCE")
          .setFont(boldFont)
          .setFontSize(24)
          .setFontColor(ColorConstants.WHITE)
          .setTextAlignment(TextAlignment.CENTER))
        .add(new Paragraph("Official Indemnity Receipt")
          .setFont(normalFont)
          .setFontSize(12)
          .setFontColor(ColorConstants.WHITE)
          .setTextAlignment(TextAlignment.CENTER))
        .setBorder(null)
        .setPadding(16);
      headerTable.addCell(headerCell);
      document.add(headerTable);

      document.add(new Paragraph("\n"));

      // ========== CARTE DÉTAILS (fond gris clair) ==========
      Table detailsCard = new Table(UnitValue.createPercentArray(new float[]{1}))
        .useAllAvailableWidth()
        .setBackgroundColor(new com.itextpdf.kernel.colors.DeviceRgb(245, 245, 245))
        .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));
      Cell cardCell = new Cell()
        .add(new Paragraph("Claim Information")
          .setFont(boldFont)
          .setFontSize(14)
          .setFontColor(ColorConstants.BLUE))
        .add(new Paragraph(" "))
        .setPadding(12)
        .setBorder(null);
      detailsCard.addCell(cardCell);

      // Tableau des détails
      Table innerTable = new Table(UnitValue.createPercentArray(new float[]{35, 65}))
        .useAllAvailableWidth()
        .setBorder(null);
      addDetailRow(innerTable, "Claim ID", String.valueOf(indemnity.getClaimId()), boldFont, normalFont);
      addDetailRow(innerTable, "Calculation Date", indemnity.getCalculationDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), boldFont, normalFont);
      addDetailRow(innerTable, "Gross Amount", String.format("%.2f DT", indemnity.getGrossAmount()), boldFont, normalFont);
      addDetailRow(innerTable, "Liability Rate", indemnity.getResponsibility() + "%", boldFont, normalFont);
      addDetailRow(innerTable, "Deductible", String.format("%.2f DT", indemnity.getDeductibleValue()), boldFont, normalFont);
      addDetailRow(innerTable, "Status", indemnity.getStatus().name(), boldFont, normalFont);

      cardCell.add(innerTable);
      document.add(detailsCard);

      document.add(new Paragraph("\n"));

      // ========== MONTANT NET (bloc bleu) ==========
      Table netTable = new Table(UnitValue.createPercentArray(new float[]{1}))
        .useAllAvailableWidth()
        .setBackgroundColor(ColorConstants.BLUE)
        .setBorder(null);
      Cell netCell = new Cell()
        .add(new Paragraph("Net Amount to Pay")
          .setFont(normalFont)
          .setFontSize(12)
          .setFontColor(ColorConstants.WHITE)
          .setTextAlignment(TextAlignment.CENTER))
        .add(new Paragraph(String.format("%.2f DT", indemnity.getNetAmount()))
          .setFont(boldFont)
          .setFontSize(24)
          .setFontColor(ColorConstants.WHITE)
          .setTextAlignment(TextAlignment.CENTER))
        .setPadding(12)
        .setBorder(null);
      netTable.addCell(netCell);
      document.add(netTable);

      document.add(new Paragraph("\n"));

      // ========== ZONE SIGNATURE ==========
      Table signatureWrapper = new Table(UnitValue.createPercentArray(new float[]{1}))
        .useAllAvailableWidth()
        .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));
      Cell signatureCell = new Cell()
        .setPadding(10)
        .setBorder(null);

      signatureCell.add(new Paragraph("Authorized Signature")
        .setFont(boldFont)
        .setFontSize(11)
        .setFontColor(ColorConstants.BLUE));

      if (signatureBase64 != null && !signatureBase64.isEmpty()) {
        try {
          byte[] imageBytes = Base64.getDecoder().decode(signatureBase64);
          Image signatureImg = new Image(ImageDataFactory.create(imageBytes));
          signatureImg.setWidth(120);
          signatureImg.setAutoScale(true);
          signatureCell.add(signatureImg);
        } catch (Exception e) {
          signatureCell.add(new Paragraph("(Signature not available)").setFontColor(ColorConstants.RED));
        }
      } else {
        signatureCell.add(new Paragraph("(Signature required)").setItalic().setFontColor(ColorConstants.GRAY));
      }
      signatureWrapper.addCell(signatureCell);
      document.add(signatureWrapper);

      document.add(new Paragraph("\n"));

      // ========== PIED DE PAGE ==========
      Paragraph footer = new Paragraph()
        .add("Electronically validated by the Salama indemnification system\n")
        .add("Issue date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
        .setFont(normalFont)
        .setFontSize(9)
        .setFontColor(ColorConstants.GRAY)
        .setTextAlignment(TextAlignment.CENTER);
      document.add(footer);

      document.close();
    } catch (Exception e) {
      e.printStackTrace();
    }

    return new ByteArrayInputStream(out.toByteArray());
  }

  private void addDetailRow(Table table, String label, String value, PdfFont boldFont, PdfFont normalFont) {
    Cell labelCell = new Cell()
      .add(new Paragraph(label).setFont(boldFont).setFontColor(ColorConstants.BLUE))
      .setBorder(null)
      .setPadding(4);
    Cell valueCell = new Cell()
      .add(new Paragraph(value).setFont(normalFont))
      .setBorder(null)
      .setPadding(4);
    table.addCell(labelCell);
    table.addCell(valueCell);
  }
}
