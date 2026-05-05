package org.example.salamainsurance.Service.Report;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.extern.slf4j.Slf4j;
import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Fraud.FraudAnalysis;
import org.example.salamainsurance.Entity.Fraud.RiskLevel;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.Driver;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.Fraud.FraudAnalysisRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class PdfReportService {

  @Autowired
  private ClaimRepository claimRepository;

  @Autowired
  private FraudAnalysisRepository fraudAnalysisRepository;

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

  public byte[] generateClaimReport(Long claimId) {
    try {
      // Get the claim
      Claim claim = claimRepository.findById(claimId)
        .orElseThrow(() -> new RuntimeException("Claim not found: " + claimId));

      // Get fraud analysis (if exists)
      FraudAnalysis fraudAnalysis = fraudAnalysisRepository.findByClaimId(claimId);

      // Create PDF
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      PdfWriter writer = new PdfWriter(baos);
      PdfDocument pdf = new PdfDocument(writer);
      Document document = new Document(pdf);

      // Main title
      Paragraph title = new Paragraph("CLAIM REPORT")
        .setFontSize(24)
        .setBold()
        .setTextAlignment(TextAlignment.CENTER)
        .setMarginBottom(20);
      document.add(title);

      // Reference and date
      document.add(new Paragraph("Reference: " + claim.getReference())
        .setFontSize(14)
        .setBold());
      document.add(new Paragraph("Report Date: " + java.time.LocalDateTime.now().format(DATETIME_FORMATTER))
        .setFontSize(10)
        .setMarginBottom(20));

      // ========== SECTION 1: GENERAL INFORMATION ==========
      document.add(createSectionTitle("1. GENERAL INFORMATION"));

      Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1, 2}));
      infoTable.setWidth(UnitValue.createPercentValue(100));

      // Status
      infoTable.addCell(createLabelCell("Status:"));
      infoTable.addCell(createValueCell(claim.getStatus().toString()));

      // Opening date
      infoTable.addCell(createLabelCell("Opening Date:"));
      infoTable.addCell(createValueCell(
        claim.getOpeningDate() != null ?
          claim.getOpeningDate().format(DATETIME_FORMATTER) : "N/A"));

      // Region
      infoTable.addCell(createLabelCell("Region:"));
      infoTable.addCell(createValueCell(claim.getRegion() != null ? claim.getRegion() : "N/A"));

      // Closing date
      infoTable.addCell(createLabelCell("Closing Date:"));
      infoTable.addCell(createValueCell(
        claim.getClosingDate() != null ?
          claim.getClosingDate().format(DATETIME_FORMATTER) : "In progress"));

      document.add(infoTable);
      document.add(new Paragraph("\n"));

      // ========== SECTION 2: ACCIDENT DETAILS ==========
      if (claim.getAccident() != null) {
        document.add(createSectionTitle("2. ACCIDENT DETAILS"));

        Accident accident = claim.getAccident();

        Table accidentTable = new Table(UnitValue.createPercentArray(new float[]{1, 3, 1, 3}));
        accidentTable.setWidth(UnitValue.createPercentValue(100));

        accidentTable.addCell(createLabelCell("Date:"));
        accidentTable.addCell(createValueCell(
          accident.getAccidentDate() != null ?
            accident.getAccidentDate().format(DATE_FORMATTER) : "N/A"));

        accidentTable.addCell(createLabelCell("Time:"));
        accidentTable.addCell(createValueCell(
          accident.getTime() != null ?
            accident.getTime().toString() : "N/A"));

        accidentTable.addCell(createLabelCell("Location:"));
        accidentTable.addCell(createValueCell(accident.getLocation() != null ? accident.getLocation() : "N/A"));

        accidentTable.addCell(createLabelCell("Injuries:"));
        accidentTable.addCell(createValueCell(
          accident.getInjuries() != null && accident.getInjuries() ? "Yes" : "No"));

        accidentTable.addCell(createLabelCell("Property Damage:"));
        accidentTable.addCell(createValueCell(
          accident.getPropertyDamage() != null && accident.getPropertyDamage() ? "Yes" : "No"));

        document.add(accidentTable);
        document.add(new Paragraph("\n"));
      }

      // ========== SECTION 3: DRIVERS INVOLVED ==========
      if (claim.getAccident() != null && claim.getAccident().getDrivers() != null) {
        document.add(createSectionTitle("3. DRIVERS INVOLVED"));

        List<Driver> drivers = claim.getAccident().getDrivers();

        for (int i = 0; i < drivers.size(); i++) {
          Driver driver = drivers.get(i);

          Paragraph driverTitle = new Paragraph("Driver " + (char)('A' + i))
            .setFontSize(12)
            .setBold()
            .setFontColor(ColorConstants.BLUE);
          document.add(driverTitle);

          Table driverTable = new Table(UnitValue.createPercentArray(new float[]{1, 3, 1, 3}));
          driverTable.setWidth(UnitValue.createPercentValue(100));

          driverTable.addCell(createLabelCell("Name:"));
          driverTable.addCell(createValueCell(driver.getName() != null ? driver.getName() : "N/A"));

          driverTable.addCell(createLabelCell("ID/CIN:"));
          driverTable.addCell(createValueCell(driver.getCin() != null ? driver.getCin() : "N/A"));

          driverTable.addCell(createLabelCell("Phone:"));
          driverTable.addCell(createValueCell(driver.getPhoneNumber() != null ? driver.getPhoneNumber() : "N/A"));

          driverTable.addCell(createLabelCell("License:"));
          driverTable.addCell(createValueCell(driver.getLicenseNumber() != null ? driver.getLicenseNumber() : "N/A"));

          driverTable.addCell(createLabelCell("Insurance:"));
          driverTable.addCell(createValueCell(driver.getInsuranceCompany() != null ? driver.getInsuranceCompany() : "N/A"));

          driverTable.addCell(createLabelCell("Policy N°:"));
          driverTable.addCell(createValueCell(driver.getPolicyNumber() != null ? driver.getPolicyNumber() : "N/A"));

          driverTable.addCell(createLabelCell("License Plate:"));
          driverTable.addCell(createValueCell(driver.getLicensePlate() != null ? driver.getLicensePlate() : "N/A"));

          driverTable.addCell(createLabelCell("Vehicle Make:"));
          driverTable.addCell(createValueCell(driver.getCarMake() != null ? driver.getCarMake() : "N/A"));

          document.add(driverTable);
          document.add(new Paragraph("\n"));
        }
      }

      // ========== SECTION 4: FRAUD ANALYSIS ==========
      if (fraudAnalysis != null) {
        document.add(createSectionTitle("4. FRAUD ANALYSIS"));

        Table fraudTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}));
        fraudTable.setWidth(UnitValue.createPercentValue(100));

        fraudTable.addCell(createLabelCell("Fraud Score:"));

        // Color the score based on risk level
        Paragraph scorePara = new Paragraph(fraudAnalysis.getFraudScore() + "/100");
        if (fraudAnalysis.getRiskLevel() == RiskLevel.HIGH) {
          scorePara.setFontColor(ColorConstants.RED).setBold();
        } else if (fraudAnalysis.getRiskLevel() == RiskLevel.MEDIUM) {
          scorePara.setFontColor(ColorConstants.ORANGE);
        } else {
          scorePara.setFontColor(ColorConstants.GREEN);
        }
        fraudTable.addCell(new Cell().add(scorePara));

        fraudTable.addCell(createLabelCell("Risk Level:"));
        fraudTable.addCell(createValueCell(fraudAnalysis.getRiskLevel().toString()));

        fraudTable.addCell(createLabelCell("Recommendation:"));
        fraudTable.addCell(createValueCell(fraudAnalysis.getRecommendation()));

        document.add(fraudTable);
        document.add(new Paragraph("\n"));

        // Triggered rules
        if (fraudAnalysis.getTriggeredRules() != null && !fraudAnalysis.getTriggeredRules().isEmpty()) {
          document.add(new Paragraph("Triggered Rules:").setBold());
          document.add(new Paragraph(fraudAnalysis.getTriggeredRules())
            .setFontSize(9)
            .setMarginLeft(20));
        }
      }

      // ========== SECTION 5: OBSERVATIONS ==========
      if (claim.getNotes() != null && !claim.getNotes().isEmpty()) {
        document.add(createSectionTitle("5. OBSERVATIONS"));
        document.add(new Paragraph(claim.getNotes())
          .setMarginLeft(20)
          .setItalic());
      }

      // Footer
      document.add(new Paragraph("\n"));
      document.add(new Paragraph("This document was automatically generated by Salama Insurance")
        .setFontSize(8)
        .setTextAlignment(TextAlignment.CENTER)
        .setFontColor(ColorConstants.GRAY));

      document.close();

      log.info("✅ PDF generated for claim {}", claim.getReference());
      return baos.toByteArray();

    } catch (Exception e) {
      log.error("❌ PDF generation error: {}", e.getMessage());
      throw new RuntimeException("Error generating PDF", e);
    }
  }

  private Paragraph createSectionTitle(String text) {
    return new Paragraph(text)
      .setFontSize(14)
      .setBold()
      .setFontColor(ColorConstants.BLUE)
      .setMarginTop(15)
      .setMarginBottom(10);
  }

  private Cell createLabelCell(String text) {
    return new Cell()
      .add(new Paragraph(text).setBold())
      .setBackgroundColor(ColorConstants.LIGHT_GRAY)
      .setPadding(5);
  }

  private Cell createValueCell(String text) {
    return new Cell()
      .add(new Paragraph(text != null ? text : ""))
      .setPadding(5);
  }
}
