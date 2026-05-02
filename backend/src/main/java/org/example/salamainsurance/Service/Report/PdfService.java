/*package org.example.salamainsurance.Service.Report;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.StampingProperties;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import com.itextpdf.signatures.*;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.example.salamainsurance.DTO.ResponsibilityResult;
import org.example.salamainsurance.Entity.Report.Accident;
import org.example.salamainsurance.Entity.Report.Circumstances;
import org.example.salamainsurance.Entity.Report.Damage;
import org.example.salamainsurance.Entity.Report.Driver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.Certificate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PdfService {

  private static final String PDF_DIR = "pdf_reports/";

  private static final DeviceRgb COLOR_PRIMARY    = new DeviceRgb(0, 51, 102);
  private static final DeviceRgb COLOR_SECONDARY  = new DeviceRgb(0, 102, 204);
  private static final DeviceRgb COLOR_LIGHT_BLUE = new DeviceRgb(230, 242, 255);
  private static final DeviceRgb COLOR_WHITE      = new DeviceRgb(255, 255, 255);
  private static final DeviceRgb COLOR_BLACK      = new DeviceRgb(0, 0, 0);
  private static final DeviceRgb COLOR_GRAY       = new DeviceRgb(100, 100, 100);
  private static final DeviceRgb COLOR_ACCENT_RED = new DeviceRgb(200, 0, 0);
  private static final DeviceRgb COLOR_LIGHT_GRAY = new DeviceRgb(245, 245, 245);
  private static final DeviceRgb COLOR_GREEN      = new DeviceRgb(21, 128, 61);

  private static final Map<String, Integer> PART_TO_ZONE = Map.ofEntries(
    Map.entry("Carrosserie", 0),
    Map.entry("Capot", 2),
    Map.entry("Coffre", 6),
    Map.entry("Pare-chocs avant", 1),
    Map.entry("Pare-chocs arrière", 7),
    Map.entry("Phare gauche", 3),
    Map.entry("Phare droit", 4),
    Map.entry("Feu arrière gauche", 8),
    Map.entry("Feu arrière droit", 9),
    Map.entry("Toit", 10),
    Map.entry("Roue 1 Droit", 11),
    Map.entry("Roue 2 Gauche", 12),
    Map.entry("Roue 3 Droit", 13),
    Map.entry("Roue 4 Gauche", 14)
  );

  @Value("${sign.keystore.path}")
  private String keystorePath;

  @Value("${sign.keystore.password}")
  private String keystorePassword;

  @Value("${sign.key.alias}")
  private String keyAlias;

  static {
    Security.addProvider(new BouncyCastleProvider());
  }

  // ═══════════════════════════════════════════════════════════
  // ENTRY POINT
  // ═══════════════════════════════════════════════════════════
  public void generatePdf(Accident accident, ResponsibilityResult result) {
    System.out.println("=== generatePdf appelé pour accident ID: " + accident.getId());
    System.out.println("=== Sketch présent: " + (accident.getSketch() != null ? "OUI " + accident.getSketch().length() : "NON"));
    try {
      java.nio.file.Files.createDirectories(Paths.get(PDF_DIR));

      String timestamp = String.valueOf(System.currentTimeMillis());
      String unsignedFileName = PDF_DIR + "unsigned_" + timestamp + "_" + accident.getId() + ".pdf";
      String signedFileName   = PDF_DIR + "accident_" + accident.getId() + ".pdf";

      generateUnsignedPdf(accident, result, unsignedFileName);
      java.nio.file.Files.deleteIfExists(Paths.get(signedFileName));
      signPdf(unsignedFileName, signedFileName);

      for (int i = 0; i < 5; i++) {
        try {
          java.nio.file.Files.deleteIfExists(Paths.get(unsignedFileName));
          break;
        } catch (Exception e) {
          Thread.sleep(200);
        }
      }
      System.out.println("PDF signé généré : " + signedFileName);
    } catch (Exception e) {
      e.printStackTrace();
      throw new RuntimeException("Erreur lors de la génération du PDF signé", e);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // GÉNÉRATION DU PDF
  // ═══════════════════════════════════════════════════════════
  private void generateUnsignedPdf(Accident accident, ResponsibilityResult result, String fileName)
    throws IOException {

    PdfWriter writer = new PdfWriter(new FileOutputStream(fileName));
    PdfDocument pdfDoc = new PdfDocument(writer);
    Document document = new Document(pdfDoc, PageSize.A4);
    document.setMargins(36, 36, 36, 36);

    // ───────────────────────────────────────
    // EN-TÊTE
    // ───────────────────────────────────────
    Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
      .useAllAvailableWidth().setMarginBottom(4);

    headerTable.addCell(new Cell()
      .add(new Paragraph("SALAMA INSURANCE").setFontColor(COLOR_PRIMARY).setFontSize(22).setBold())
      .add(new Paragraph("Assurance & Réassurance").setFontColor(COLOR_SECONDARY).setFontSize(11))
      .setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE));

    headerTable.addCell(new Cell()
      .add(new Paragraph("RAPPORT D'ACCIDENT").setFontColor(COLOR_PRIMARY).setFontSize(18).setBold().setTextAlignment(TextAlignment.RIGHT))
      .add(new Paragraph("N° " + accident.getId() + "  —  " + accident.getAccidentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).setFontColor(COLOR_GRAY).setFontSize(11).setTextAlignment(TextAlignment.RIGHT))
      .add(new Paragraph("STATUT : " + accident.getStatus()).setFontColor(COLOR_SECONDARY).setFontSize(10).setBold().setTextAlignment(TextAlignment.RIGHT))
      .setBorder(Border.NO_BORDER).setVerticalAlignment(VerticalAlignment.MIDDLE));

    document.add(headerTable);

    document.add(new Table(1).useAllAvailableWidth()
      .addCell(new Cell().setBorder(Border.NO_BORDER)
        .setBorderBottom(new SolidBorder(COLOR_PRIMARY, 3)).setPadding(0)));

    document.add(new Paragraph(" ").setMarginBottom(4));

    // ───────────────────────────────────────
    // SECTION 1 — INFORMATIONS GÉNÉRALES
    // ───────────────────────────────────────
    document.add(sectionTitle("1. INFORMATIONS GÉNÉRALES"));

    Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
      .useAllAvailableWidth().setMarginBottom(10);

    addInfoCell(infoTable, "Date", accident.getAccidentDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
    addInfoCell(infoTable, "Heure", accident.getTime().format(DateTimeFormatter.ofPattern("HH:mm")));
    addInfoCell(infoTable, "Blessés", accident.getInjuries() ? "OUI" : "NON");
    addInfoCell(infoTable, "Dégâts matériels", accident.getPropertyDamage() ? "OUI" : "NON");
    document.add(infoTable);

    addKeyValue(document, "Lieu de l'accident", accident.getLocation());

    if (accident.getObservations() != null && !accident.getObservations().isEmpty()) {
      addKeyValue(document, "Observations", accident.getObservations());
    }

    // ───────────────────────────────────────
    // SECTION 2 — ZONES ENDOMMAGÉES
    // ───────────────────────────────────────
    document.add(sectionTitle("2. ZONES ENDOMMAGÉES"));

    Table zonesTable = new Table(UnitValue.createPercentArray(1)).useAllAvailableWidth().setMarginBottom(10);
    String zonesText = (accident.getDamagedZones() != null && !accident.getDamagedZones().isEmpty())
      ? accident.getDamagedZones().stream().map(z -> "  Zone " + z + "  ").reduce("", String::concat)
      : "Aucune zone renseignée";

    zonesTable.addCell(new Cell()
      .add(new Paragraph(zonesText).setTextAlignment(TextAlignment.CENTER).setBold())
      .setBackgroundColor(COLOR_LIGHT_BLUE)
      .setBorder(new SolidBorder(COLOR_SECONDARY, 1)).setPadding(8));
    document.add(zonesTable);

    // ───────────────────────────────────────
    // SECTION 3 — CONDUCTEURS
    // ───────────────────────────────────────
    document.add(sectionTitle("3. CONDUCTEURS"));

    for (Driver driver : accident.getDrivers()) {
      boolean isA = "DRIVER_A".equals(driver.getDriverType().name());
      DeviceRgb driverColor = isA ? COLOR_PRIMARY : COLOR_SECONDARY;
      String driverLabel = isA ? "CONDUCTEUR A" : "CONDUCTEUR B";

      document.add(new Table(1).useAllAvailableWidth()
        .addCell(new Cell()
          .add(new Paragraph(driverLabel).setFontColor(COLOR_WHITE).setBold().setFontSize(12))
          .setBackgroundColor(driverColor).setBorder(Border.NO_BORDER).setPadding(7)));

      Table driverInfo = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
        .useAllAvailableWidth().setMarginBottom(6);

      addDriverDetail(driverInfo, "Nom complet", driver.getName());
      addDriverDetail(driverInfo, "CIN", driver.getCin());
      addDriverDetail(driverInfo, "Adresse", driver.getAddress());
      addDriverDetail(driverInfo, "Téléphone", driver.getPhoneNumber());
      addDriverDetail(driverInfo, "N° permis", driver.getLicenseNumber());
      addDriverDetail(driverInfo, "Assurance", driver.getInsuranceCompany());
      addDriverDetail(driverInfo, "N° contrat", driver.getPolicyNumber());
      addDriverDetail(driverInfo, "Immatriculation", driver.getLicensePlate());
      addDriverDetail(driverInfo, "Marque véhicule", driver.getCarMake());
      document.add(driverInfo);

      addSignatureToDocument(document, driver, driverColor);

      if (driver.getCircumstances() != null && !driver.getCircumstances().isEmpty()) {
        document.add(new Table(1).useAllAvailableWidth()
          .addCell(new Cell()
            .add(new Paragraph("Circonstances et responsabilité").setFontColor(driverColor).setBold())
            .setBorder(Border.NO_BORDER)
            .setBorderBottom(new SolidBorder(driverColor, 1)).setPaddingBottom(3)));

        Table circTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
          .useAllAvailableWidth().setMarginBottom(12);

        boolean altCirc = false;
        for (Circumstances circ : driver.getCircumstances()) {
          DeviceRgb bg = altCirc ? COLOR_LIGHT_BLUE : COLOR_WHITE;
          circTable.addCell(new Cell()
            .add(new Paragraph(circ.name().replace("_", " ")).setFontSize(10))
            .setBackgroundColor(bg).setBorder(new SolidBorder(COLOR_LIGHT_BLUE, 1)).setPadding(5));
          circTable.addCell(new Cell()
            .add(new Paragraph(circ.getFaultPercentage() + "%")
              .setTextAlignment(TextAlignment.CENTER).setBold().setFontSize(10).setFontColor(COLOR_ACCENT_RED))
            .setBackgroundColor(bg).setBorder(new SolidBorder(COLOR_LIGHT_BLUE, 1)).setPadding(5));
          altCirc = !altCirc;
        }
        document.add(circTable);
      }
    }

    // ───────────────────────────────────────
    // SECTION 4 — DÉGÂTS DU VÉHICULE
    // ───────────────────────────────────────
    List<Damage> damages = accident.getDamages();
    if (damages != null && !damages.isEmpty()) {
      document.add(sectionTitle("4. DÉGÂTS DU VÉHICULE"));

      List<Damage> damagesA = damages.stream()
        .filter(d -> "A".equals(d.getDriver()) || "DRIVER_A".equals(d.getDriver()))
        .collect(Collectors.toList());

      List<Damage> damagesB = damages.stream()
        .filter(d -> "B".equals(d.getDriver()) || "DRIVER_B".equals(d.getDriver()))
        .collect(Collectors.toList());

      // ── Conducteur A ──
      if (!damagesA.isEmpty()) {
        document.add(new Table(1).useAllAvailableWidth()
          .addCell(new Cell()
            .add(new Paragraph("Conducteur A").setFontColor(COLOR_WHITE).setBold().setFontSize(11))
            .setBackgroundColor(COLOR_PRIMARY).setBorder(Border.NO_BORDER).setPadding(6)));
        document.add(buildDamageTable(damagesA));

        document.add(new Paragraph("Schéma des dommages — Conducteur A")
          .setFontColor(COLOR_GRAY).setFontSize(9).setItalic()
          .setTextAlignment(TextAlignment.CENTER));
        addCarDiagramForZones(document, getZonesForDamages(damagesA));
      }

      // ── Conducteur B ──
      if (!damagesB.isEmpty()) {
        document.add(new Table(1).useAllAvailableWidth()
          .addCell(new Cell()
            .add(new Paragraph("Conducteur B").setFontColor(COLOR_WHITE).setBold().setFontSize(11))
            .setBackgroundColor(COLOR_SECONDARY).setBorder(Border.NO_BORDER).setPadding(6)));
        document.add(buildDamageTable(damagesB));

        document.add(new Paragraph("Schéma des dommages — Conducteur B")
          .setFontColor(COLOR_GRAY).setFontSize(9).setItalic()
          .setTextAlignment(TextAlignment.CENTER));
        addCarDiagramForZones(document, getZonesForDamages(damagesB));
      }

      // Fallback : si aucun driver renseigné
      if (damagesA.isEmpty() && damagesB.isEmpty()) {
        document.add(buildDamageTable(damages));
        addCarDiagramForZones(document, getZonesForDamages(damages));
      }

      // Croquis de l'accident
      addSketchToPdf(document, accident);
    }

    // ───────────────────────────────────────
    // SECTION 5 — RESPONSABILITÉ
    // ───────────────────────────────────────
    String sectionNum = (damages != null && !damages.isEmpty()) ? "5" : "4";
    document.add(sectionTitle(sectionNum + ". RESPONSABILITÉ"));

    int percentA = Integer.parseInt(result.getPercentA());
    int percentB = Integer.parseInt(result.getPercentB());

    Table respTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1}))
      .useAllAvailableWidth().setMarginTop(8).setMarginBottom(20);

    respTable.addCell(createResponsibilityCell("Conducteur A", percentA, percentA >= percentB, COLOR_PRIMARY));
    respTable.addCell(createDecisionCell(formatDecision(result.getDecision())));
    respTable.addCell(createResponsibilityCell("Conducteur B", percentB, percentB >= percentA, COLOR_SECONDARY));
    document.add(respTable);

    // ───────────────────────────────────────
    // FOOTER
    // ───────────────────────────────────────
    document.add(new Table(1).useAllAvailableWidth()
      .addCell(new Cell()
        .add(new Paragraph("Document généré automatiquement par Salama Insurance — Tous droits réservés")
          .setFontColor(COLOR_GRAY).setFontSize(9).setTextAlignment(TextAlignment.CENTER))
        .setBorderTop(new SolidBorder(COLOR_LIGHT_BLUE, 1))
        .setBorder(Border.NO_BORDER).setPaddingTop(10)));

    document.close();
  }

  // ═══════════════════════════════════════════════════════════
  // TABLEAU DES DOMMAGES
  // ═══════════════════════════════════════════════════════════
  private Table buildDamageTable(List<Damage> damages) {
    Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 3, 1}))
      .useAllAvailableWidth().setMarginBottom(12);

    for (String h : new String[]{"Pièce", "Type", "Description", "Coût (TND)"}) {
      table.addCell(new Cell()
        .add(new Paragraph(h).setFontColor(COLOR_WHITE).setFontSize(10).setBold())
        .setBackgroundColor(COLOR_PRIMARY).setBorder(Border.NO_BORDER).setPadding(7));
    }

    boolean alt = false;
    double total = 0;
    for (Damage d : damages) {
      DeviceRgb bg = alt ? COLOR_LIGHT_BLUE : COLOR_WHITE;
      table.addCell(cellData(d.getPart(), bg));
      table.addCell(cellData(d.getType(), bg));
      table.addCell(cellData(d.getDescription(), bg));
      table.addCell(new Cell()
        .add(new Paragraph(d.getCost() != null ? d.getCost().toString() : "0")
          .setFontSize(9).setTextAlignment(TextAlignment.RIGHT))
        .setBackgroundColor(bg).setBorder(new SolidBorder(COLOR_LIGHT_BLUE, 1)).setPadding(5));
      if (d.getCost() != null) total += d.getCost();
      alt = !alt;
    }

    table.addCell(new Cell(1, 3)
      .add(new Paragraph("TOTAL ESTIMÉ").setFontColor(COLOR_WHITE).setBold().setFontSize(10).setTextAlignment(TextAlignment.RIGHT))
      .setBackgroundColor(COLOR_PRIMARY).setBorder(Border.NO_BORDER).setPadding(8));
    table.addCell(new Cell()
      .add(new Paragraph(String.format("%.2f TND", total)).setFontColor(COLOR_WHITE).setBold().setFontSize(10).setTextAlignment(TextAlignment.RIGHT))
      .setBackgroundColor(COLOR_PRIMARY).setBorder(Border.NO_BORDER).setPadding(8));

    return table;
  }

  // ═══════════════════════════════════════════════════════════
  // ZONES PAR DOMMAGES
  // ═══════════════════════════════════════════════════════════
  private List<Integer> getZonesForDamages(List<Damage> damages) {
    return damages.stream()
      .map(d -> PART_TO_ZONE.get(d.getPart()))
      .filter(z -> z != null)
      .distinct()
      .collect(Collectors.toList());
  }

  // ═══════════════════════════════════════════════════════════
  // SCHÉMA VOITURE PAR ZONES
  // ═══════════════════════════════════════════════════════════
  private void addCarDiagramForZones(Document document, List<Integer> zones) {
    try {
      String svg = generateCarSvg(zones);
      byte[] pngBytes = svgToPng(svg);
      Image carImg = new Image(ImageDataFactory.create(pngBytes))
        .setWidth(300)
        .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
      document.add(carImg);
      document.add(new Paragraph(" "));
    } catch (Exception e) {
      System.err.println("Erreur génération diagramme voiture : " + e.getMessage());
    }
  }

  private void addCarDiagram(Document document, Accident accident) {
    try {
      String svg = generateCarSvg(accident.getDamagedZones());
      byte[] pngBytes = svgToPng(svg);
      Image carImg = new Image(ImageDataFactory.create(pngBytes))
        .setWidth(400)
        .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
      document.add(new Paragraph("Zones endommagées (en rouge)")
        .setFontColor(COLOR_GRAY).setFontSize(9).setItalic().setTextAlignment(TextAlignment.CENTER));
      document.add(carImg);
      document.add(new Paragraph(" "));
    } catch (Exception e) {
      System.err.println("Erreur génération diagramme voiture : " + e.getMessage());
    }
  }

  private String generateCarSvg(List<Integer> damagedZones) {
    java.util.function.Function<Integer, String> zoneColor = (zoneId) ->
      (damagedZones != null && damagedZones.contains(zoneId)) ? "#dc2626" : "#3b82f6";
    java.util.function.Function<Integer, String> zoneOpacity = (zoneId) ->
      (damagedZones != null && damagedZones.contains(zoneId)) ? "0.85" : "0.3";

    return """
        <svg xmlns="http://www.w3.org/2000/svg" width="500" height="300" viewBox="0 0 500 300">
          <rect width="500" height="300" fill="#f8fafc" rx="12"/>
          <text x="250" y="25" text-anchor="middle" font-size="13" font-family="Arial" font-weight="bold" fill="#1e3a5f">SCHÉMA DES DOMMAGES</text>
          <rect x="150" y="50" width="200" height="200" rx="30" ry="50" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="2"/>
          <rect x="165" y="40" width="170" height="25" rx="8" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="165" y="65" width="170" height="55" rx="5" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <ellipse cx="170" cy="62" rx="14" ry="9" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <ellipse cx="330" cy="62" rx="14" ry="9" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="175" y="125" width="150" height="50" rx="5" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="165" y="180" width="170" height="55" rx="5" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="165" y="235" width="170" height="25" rx="8" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <ellipse cx="170" cy="238" rx="14" ry="9" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <ellipse cx="330" cy="238" rx="14" ry="9" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="120" y="80" width="30" height="50" rx="8" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="350" y="80" width="30" height="50" rx="8" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="120" y="170" width="30" height="50" rx="8" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <rect x="350" y="170" width="30" height="50" rx="8" fill="%s" fill-opacity="%s" stroke="#1e3a5f" stroke-width="1.5"/>
          <text x="250" y="22" text-anchor="middle" font-size="10" font-family="Arial" fill="#64748b">▲ AVANT</text>
          <text x="250" y="285" text-anchor="middle" font-size="10" font-family="Arial" fill="#64748b">▼ ARRIÈRE</text>
          <rect x="10" y="260" width="12" height="12" fill="#dc2626" fill-opacity="0.85"/>
          <text x="26" y="271" font-size="9" font-family="Arial" fill="#374151">Zone endommagée</text>
          <rect x="110" y="260" width="12" height="12" fill="#3b82f6" fill-opacity="0.3"/>
          <text x="126" y="271" font-size="9" font-family="Arial" fill="#374151">Zone intacte</text>
        </svg>
        """.formatted(
      zoneColor.apply(0),  zoneOpacity.apply(0),
      zoneColor.apply(1),  zoneOpacity.apply(1),
      zoneColor.apply(2),  zoneOpacity.apply(2),
      zoneColor.apply(3),  zoneOpacity.apply(3),
      zoneColor.apply(4),  zoneOpacity.apply(4),
      zoneColor.apply(10), zoneOpacity.apply(10),
      zoneColor.apply(6),  zoneOpacity.apply(6),
      zoneColor.apply(7),  zoneOpacity.apply(7),
      zoneColor.apply(8),  zoneOpacity.apply(8),
      zoneColor.apply(9),  zoneOpacity.apply(9),
      zoneColor.apply(11), zoneOpacity.apply(11),
      zoneColor.apply(12), zoneOpacity.apply(12),
      zoneColor.apply(13), zoneOpacity.apply(13),
      zoneColor.apply(14), zoneOpacity.apply(14)
    );
  }

  private byte[] svgToPng(String svgContent) throws Exception {
    org.apache.batik.transcoder.TranscoderInput input =
      new org.apache.batik.transcoder.TranscoderInput(new java.io.StringReader(svgContent));
    java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
    org.apache.batik.transcoder.TranscoderOutput output =
      new org.apache.batik.transcoder.TranscoderOutput(outputStream);
    org.apache.batik.transcoder.image.PNGTranscoder transcoder =
      new org.apache.batik.transcoder.image.PNGTranscoder();
    transcoder.addTranscodingHint(org.apache.batik.transcoder.image.PNGTranscoder.KEY_WIDTH, 500f);
    transcoder.addTranscodingHint(org.apache.batik.transcoder.image.PNGTranscoder.KEY_HEIGHT, 300f);
    transcoder.transcode(input, output);
    return outputStream.toByteArray();
  }

  // ═══════════════════════════════════════════════════════════
  // CROQUIS
  // ═══════════════════════════════════════════════════════════
  private void addSketchToPdf(Document document, Accident accident) {
    String sketch = accident.getSketch();
    if (sketch == null || sketch.isEmpty()) return;

    document.add(sectionTitle("CROQUIS DE L'ACCIDENT"));

    try {
      String base64Data = sketch.contains(",") ? sketch.split(",")[1] : sketch;
      byte[] imgBytes = Base64.getDecoder().decode(base64Data);

      Image sketchImg = new Image(ImageDataFactory.create(imgBytes))
        .setWidth(UnitValue.createPercentValue(100))
        .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER)
        .setMarginBottom(10);

      Table sketchTable = new Table(1).useAllAvailableWidth();
      sketchTable.addCell(new Cell()
        .add(sketchImg)
        .setBorder(new SolidBorder(COLOR_SECONDARY, 1.5f))
        .setPadding(6)
        .setBackgroundColor(new DeviceRgb(248, 250, 252)));
      document.add(sketchTable);

    } catch (Exception e) {
      document.add(new Paragraph("Croquis non disponible.").setFontColor(COLOR_GRAY).setFontSize(10).setItalic());
      System.err.println("Erreur croquis PDF : " + e.getMessage());
    }
  }

  // ═══════════════════════════════════════════════════════════
  // SIGNATURE IMAGE
  // ═══════════════════════════════════════════════════════════
  private void addSignatureToDocument(Document document, Driver driver, DeviceRgb driverColor) {
    Table sigTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
      .useAllAvailableWidth().setMarginBottom(6);

    sigTable.addCell(new Cell()
      .add(new Paragraph("Signature").setFontSize(10).setBold())
      .setBackgroundColor(COLOR_LIGHT_BLUE)
      .setBorder(new SolidBorder(COLOR_WHITE, 1))
      .setPadding(6).setVerticalAlignment(VerticalAlignment.MIDDLE));

    Cell sigValueCell = new Cell().setBorder(new SolidBorder(COLOR_WHITE, 1)).setPadding(6);

    String sig = driver.getSignature();
    if (sig != null && sig.startsWith("data:image")) {
      try {
        String base64Data = sig.split(",")[1];
        byte[] imgBytes = Base64.getDecoder().decode(base64Data);
        Image sigImg = new Image(ImageDataFactory.create(imgBytes))
          .setWidth(160).setHeight(55)
          .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.LEFT);
        sigValueCell.add(sigImg).setBorderBottom(new SolidBorder(driverColor, 1));
      } catch (Exception e) {
        sigValueCell.add(new Paragraph("Non fournie").setFontColor(COLOR_GRAY).setFontSize(10));
      }
    } else {
      sigValueCell.add(new Paragraph("Non fournie").setFontColor(COLOR_GRAY).setFontSize(10));
    }

    sigTable.addCell(sigValueCell);
    document.add(sigTable);
  }

  // ═══════════════════════════════════════════════════════════
  // MÉTHODES UTILITAIRES
  // ═══════════════════════════════════════════════════════════
  private Paragraph sectionTitle(String text) {
    return new Paragraph(text).setFontColor(COLOR_PRIMARY).setFontSize(14).setBold()
      .setMarginTop(14).setMarginBottom(6);
  }

  private void addInfoCell(Table table, String label, String value) {
    table.addCell(new Cell()
      .add(new Paragraph(label).setFontSize(9).setFontColor(COLOR_GRAY))
      .add(new Paragraph(value).setFontSize(12).setBold())
      .setBackgroundColor(COLOR_LIGHT_BLUE)
      .setBorder(new SolidBorder(COLOR_WHITE, 1))
      .setPadding(8).setTextAlignment(TextAlignment.CENTER));
  }

  private void addKeyValue(Document doc, String key, String value) {
    Table t = new Table(UnitValue.createPercentArray(new float[]{1, 3}))
      .useAllAvailableWidth().setMarginBottom(6);
    t.addCell(new Cell().add(new Paragraph(key).setBold().setFontColor(COLOR_PRIMARY))
      .setBorder(Border.NO_BORDER).setPadding(5));
    t.addCell(new Cell().add(new Paragraph(value != null ? value : ""))
      .setBorder(Border.NO_BORDER).setPadding(5));
    doc.add(t);
  }

  private void addDriverDetail(Table table, String label, String value) {
    table.addCell(new Cell()
      .add(new Paragraph(label).setFontSize(10).setBold())
      .setBackgroundColor(COLOR_LIGHT_BLUE)
      .setBorder(new SolidBorder(COLOR_WHITE, 1)).setPadding(6));
    table.addCell(new Cell()
      .add(new Paragraph(value != null ? value : "—").setFontSize(10))
      .setBorder(new SolidBorder(COLOR_WHITE, 1)).setPadding(6));
  }

  private Cell cellData(String value, DeviceRgb bg) {
    return new Cell()
      .add(new Paragraph(value != null ? value : "—").setFontSize(9))
      .setBackgroundColor(bg)
      .setBorder(new SolidBorder(COLOR_LIGHT_BLUE, 1)).setPadding(5);
  }

  private Cell createResponsibilityCell(String title, int percentage, boolean isHigher, DeviceRgb color) {
    return new Cell()
      .add(new Paragraph(title).setFontColor(color).setBold().setTextAlignment(TextAlignment.CENTER))
      .add(new Paragraph(percentage + "%").setFontSize(28).setBold()
        .setFontColor(isHigher ? COLOR_ACCENT_RED : COLOR_GREEN).setTextAlignment(TextAlignment.CENTER))
      .setBackgroundColor(COLOR_LIGHT_BLUE)
      .setBorder(new SolidBorder(color, 1)).setPadding(12);
  }

  private Cell createDecisionCell(String decision) {
    return new Cell()
      .add(new Paragraph("DÉCISION").setFontColor(COLOR_WHITE).setBold().setTextAlignment(TextAlignment.CENTER))
      .add(new Paragraph(decision).setFontColor(COLOR_WHITE).setFontSize(11).setBold().setTextAlignment(TextAlignment.CENTER))
      .setBackgroundColor(COLOR_PRIMARY)
      .setBorder(Border.NO_BORDER).setPadding(12)
      .setVerticalAlignment(VerticalAlignment.MIDDLE);
  }

  private String formatDecision(String decision) {
    return switch (decision) {
      case "DRIVER_A_RESPONSABLE"   -> "Conducteur A\nResponsable";
      case "DRIVER_B_RESPONSABLE"   -> "Conducteur B\nResponsable";
      case "RESPONSABILITE_PARTAGEE"-> "Responsabilité\nPartagée";
      default -> decision;
    };
  }

  // ═══════════════════════════════════════════════════════════
  // SIGNATURE PDF (cryptographique)
  // ═══════════════════════════════════════════════════════════
  private void signPdf(String srcPath, String destPath) throws Exception {
    KeyStore ks = KeyStore.getInstance("PKCS12");
    try (FileInputStream fis = new FileInputStream(keystorePath)) {
      ks.load(fis, keystorePassword.toCharArray());
    }
    PrivateKey pk = (PrivateKey) ks.getKey(keyAlias, keystorePassword.toCharArray());
    Certificate[] chain = ks.getCertificateChain(keyAlias);
    if (pk == null) throw new RuntimeException("Clé privée introuvable : " + keyAlias);
    if (chain == null || chain.length == 0) throw new RuntimeException("Certificat introuvable : " + keyAlias);

    try (PdfReader reader = new PdfReader(srcPath);
         FileOutputStream out = new FileOutputStream(destPath)) {
      PdfSigner signer = new PdfSigner(reader, out, new StampingProperties());
      signer.setFieldName("Signature_Salama");
      PdfSignatureAppearance appearance = signer.getSignatureAppearance();
      appearance.setReason("Validation officielle du rapport d'accident");
      appearance.setLocation("Salama Insurance");
      appearance.setPageNumber(1);
      appearance.setPageRect(new Rectangle(36, 36, 200, 50));
      IExternalDigest digest = new BouncyCastleDigest();
      IExternalSignature signature = new PrivateKeySignature(pk, DigestAlgorithms.SHA256, "BC");
      signer.signDetached(digest, signature, chain, Collections.emptyList(),
        null, null, 0, PdfSigner.CryptoStandard.CADES);
    }
  }
}
*/
