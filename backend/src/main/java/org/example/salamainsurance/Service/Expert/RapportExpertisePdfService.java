package org.example.salamainsurance.Service.Expert;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.io.image.ImageDataFactory;
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
import org.example.salamainsurance.Entity.Expert.*;
import org.example.salamainsurance.Repository.Expert.ExpertReportHassenRepository;
import org.example.salamainsurance.Repository.Expert.PhotoAccidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class RapportExpertisePdfService {

    private final ExpertReportHassenRepository reportRepository;
    private final PhotoAccidentRepository photoRepository;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final DeviceRgb BLUE_DARK = new DeviceRgb(0, 51, 102);
    private final DeviceRgb BLUE_LIGHT = new DeviceRgb(220, 235, 250);
    private final DeviceRgb GRAY_LIGHT = new DeviceRgb(245, 245, 245);
    private final DeviceRgb ORANGE = new DeviceRgb(230, 126, 34);
    private final DeviceRgb GREEN = new DeviceRgb(39, 174, 96);
    private final DeviceRgb RED = new DeviceRgb(192, 57, 43);

    public RapportExpertisePdfService(ExpertReportHassenRepository reportRepository,
                                      PhotoAccidentRepository photoRepository) {
        this.reportRepository = reportRepository;
        this.photoRepository = photoRepository;
    }


    @Transactional
    public byte[] genererPdfRapport(Integer rapportId) {
        ExpertReportHassen rapport = reportRepository.findById(rapportId)
                .orElseThrow(() -> new RuntimeException("Rapport non trouve avec l'ID: " + rapportId));

        // Forcer le chargement des relations LAZY
        if (rapport.getExpert() != null) {
            rapport.getExpert().getFirstName();
        }
        if (rapport.getDommages() != null) {
            rapport.getDommages().size();
        }
        if (rapport.getMainsOeuvre() != null) {
            rapport.getMainsOeuvre().size();
        }
        if (rapport.getPiecesJointes() != null) {
            rapport.getPiecesJointes().size();
        }

        // ✅ CALCUL AUTOMATIQUE DES TOTAUX avant génération PDF
        BigDecimal TVA_RATE = new BigDecimal("0.19");
        BigDecimal totalFournituresHT = BigDecimal.ZERO;
        if (rapport.getDommages() != null) {
            for (DommageHassen d : rapport.getDommages()) {
                if (d.getMontant() != null) {
                    BigDecimal montant = d.getMontant();
                    if (d.getQuantite() != null) montant = montant.multiply(new BigDecimal(d.getQuantite()));
                    totalFournituresHT = totalFournituresHT.add(montant);
                }
            }
        }
        BigDecimal tvaFournitures = totalFournituresHT.multiply(TVA_RATE).setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalFournituresTTC = totalFournituresHT.add(tvaFournitures);

        BigDecimal totalMainOeuvreHT = BigDecimal.ZERO;
        if (rapport.getMainsOeuvre() != null) {
            for (MainOeuvreHassen m : rapport.getMainsOeuvre()) {
                if (m.getMontant() != null) totalMainOeuvreHT = totalMainOeuvreHT.add(m.getMontant());
            }
        }
        BigDecimal tvaMainOeuvre = totalMainOeuvreHT.multiply(TVA_RATE).setScale(3, RoundingMode.HALF_UP);
        BigDecimal totalMainOeuvreTTC = totalMainOeuvreHT.add(tvaMainOeuvre);
        BigDecimal totalGeneral = totalFournituresTTC.add(totalMainOeuvreTTC);
        BigDecimal vetuste = rapport.getVetuste() != null ? rapport.getVetuste() : BigDecimal.ZERO;
        BigDecimal remise = rapport.getRemise() != null ? rapport.getRemise() : BigDecimal.ZERO;
        BigDecimal totalNet = totalGeneral.subtract(vetuste).subtract(remise);

        rapport.setTotalFournituresHT(totalFournituresHT);
        rapport.setTvaFournitures(tvaFournitures);
        rapport.setTotalFournituresTTC(totalFournituresTTC);
        rapport.setTotalMainOeuvreHT(totalMainOeuvreHT);
        rapport.setTotalMainOeuvreTTC(totalMainOeuvreTTC);
        rapport.setTotalGeneral(totalGeneral);
        rapport.setTotalNet(totalNet);
        reportRepository.save(rapport);

        // ✅ Charger les photos du rapport
        List<PhotoAccident> photos = photoRepository.findByRapport_IdRapport(rapportId);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf, PageSize.A4);
            document.setMargins(30, 30, 30, 30);

            addHeader(document, rapport);
            addGeneralInfo(document, rapport);
            addExpertSection(document, rapport);
            addAssureSection(document, rapport);
            addTiersSection(document, rapport);
            addVehiculeSection(document, rapport);
            addDommagesSection(document, rapport);
            addMainOeuvreSection(document, rapport);
            addFinanceSection(document, rapport);
            addPhotosSection(document, photos);
            addConclusionSection(document, rapport);
            addFooter(document, rapport);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la generation du PDF: " + e.getMessage(), e);
        }
    }

    private void addHeader(Document document, ExpertReportHassen rapport) {
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .useAllAvailableWidth();

        Cell leftCell = new Cell().setBorder(Border.NO_BORDER);
        leftCell.add(new Paragraph("SALAMA INSURANCE")
                .setFontSize(22).setBold().setFontColor(BLUE_DARK));
        leftCell.add(new Paragraph("Rapport d'Expertise Automobile")
                .setFontSize(14).setFontColor(ORANGE));

        Cell rightCell = new Cell().setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT);
        rightCell.add(new Paragraph("RAPPORT NO")
                .setFontSize(10).setFontColor(ColorConstants.GRAY));
        rightCell.add(new Paragraph(safe(rapport.getNumeroReference()))
                .setFontSize(16).setBold().setFontColor(BLUE_DARK));

      String statut = rapport.getStatutRapport() != null ? rapport.getStatutRapport().name() : "N/A";
      DeviceRgb statutColor = getStatutColor(rapport.getStatutRapport());
      rightCell.add(new Paragraph("STATUT: " + statut)
        .setFontSize(10).setBold().setFontColor(statutColor));

      headerTable.addCell(leftCell);
      headerTable.addCell(rightCell);
      document.add(headerTable);

      document.add(new Paragraph("")
        .setBorderBottom(new SolidBorder(BLUE_DARK, 2))
        .setMarginBottom(15));
    }


  private void addGeneralInfo(Document document, ExpertReportHassen rapport) {
        document.add(createSectionTitle("GENERAL INFO"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .useAllAvailableWidth().setMarginBottom(10);

        addInfoCell(table, "Date Mission", formatDate(rapport.getDateMission()));
        addInfoCell(table, "Date Accident", formatDate(rapport.getDateAccident()));
        addInfoCell(table, "Date Examen", formatDate(rapport.getDateExamen()));
        addInfoCell(table, "Lieu Examen", safe(rapport.getLieuExamen()));

        document.add(table);

        if (rapport.getObservation() != null && !rapport.getObservation().isEmpty()) {
            document.add(new Paragraph("Observation: " + rapport.getObservation())
                    .setFontSize(9).setItalic().setFontColor(ColorConstants.DARK_GRAY)
                    .setMarginBottom(10));
        }
    }

    private void addExpertSection(Document document, ExpertReportHassen rapport) {
        if (rapport.getExpert() == null) return;
        ExpertHassen expert = rapport.getExpert();

        document.add(createSectionTitle("EXPERT"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .useAllAvailableWidth().setMarginBottom(10);

        addInfoCell(table, "Nom", safe(expert.getLastName()) + " " + safe(expert.getFirstName()));
        addInfoCell(table, "Specialite", safe(expert.getSpecialty()));
        addInfoCell(table, "Telephone", safe(expert.getPhone()));
        addInfoCell(table, "Email", safe(expert.getEmail()));

        document.add(table);
    }

    private void addAssureSection(Document document, ExpertReportHassen rapport) {
        document.add(createSectionTitle("ASSURE & ASSURANCE"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .useAllAvailableWidth().setMarginBottom(10);

        addInfoCell(table, "Nom Assure", safe(rapport.getAssureNom()));
        addInfoCell(table, "No Contrat", safe(rapport.getAssureContrat()));
        addInfoCell(table, "No Dossier", safe(rapport.getAssureDossier()));
        addInfoCell(table, "Assurance", safe(rapport.getMandantAssurance()));

        document.add(table);
    }

    private void addTiersSection(Document document, ExpertReportHassen rapport) {
        if (rapport.getTiersNom() == null || rapport.getTiersNom().isEmpty()) return;

        document.add(createSectionTitle("TIERS IMPLIQUE"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .useAllAvailableWidth().setMarginBottom(10);

        addInfoCell(table, "Nom Tiers", safe(rapport.getTiersNom()));
        addInfoCell(table, "Assurance Tiers", safe(rapport.getTiersAssurance()));
        addInfoCell(table, "Immatriculation", safe(rapport.getTiersImmatriculation()));
        addInfoCell(table, "No Contrat", safe(rapport.getTiersContrat()));

        document.add(table);
    }

    private void addVehiculeSection(Document document, ExpertReportHassen rapport) {
        document.add(createSectionTitle("VEHICULE ASSURE"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .useAllAvailableWidth().setMarginBottom(10);

        addInfoCell(table, "Marque", safe(rapport.getVehiculeMarque()));
        addInfoCell(table, "Type/Modele", safe(rapport.getVehiculeType()));
        addInfoCell(table, "Immatriculation", safe(rapport.getVehiculeImmatriculation()));
        addInfoCell(table, "Couleur", safe(rapport.getVehiculeCouleur()));
        addInfoCell(table, "Puissance", safe(rapport.getVehiculePuissance()));
        addInfoCell(table, "Energie", rapport.getVehiculeEnergie() != null ? rapport.getVehiculeEnergie().name() : "N/A");
        addInfoCell(table, "Etat", rapport.getVehiculeEtat() != null ? rapport.getVehiculeEtat().name() : "N/A");
        addInfoCell(table, "No Serie (VIN)", safe(rapport.getVehiculeNumeroSerie()));
        addInfoCell(table, "1ere Circulation", formatDate(rapport.getVehiculeDateMiseCirculation()));
        addInfoCell(table, "Kilometrage", rapport.getVehiculeIndexKm() != null ? rapport.getVehiculeIndexKm() + " km" : "N/A");
        table.addCell(new Cell().setBorder(Border.NO_BORDER));
        table.addCell(new Cell().setBorder(Border.NO_BORDER));

        document.add(table);
    }

    private void addDommagesSection(Document document, ExpertReportHassen rapport) {
        List<DommageHassen> dommages = rapport.getDommages();
        if (dommages == null || dommages.isEmpty()) return;

        document.add(createSectionTitle("DOMMAGES / FOURNITURES"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{5, 30, 15, 10, 10, 10, 20}))
                .useAllAvailableWidth().setMarginBottom(10);

        String[] headers = {"No", "Designation", "Point de Choc", "Qte", "Occasion", "TVA %", "Montant (DT)"};
        for (String h : headers) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(BLUE_DARK)
                    .add(new Paragraph(h).setFontSize(8).setBold().setFontColor(ColorConstants.WHITE))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setVerticalAlignment(VerticalAlignment.MIDDLE)
                    .setPadding(5));
        }

        int i = 1;
        for (DommageHassen d : dommages) {
            DeviceRgb bgColor = (i % 2 == 0) ? GRAY_LIGHT : new DeviceRgb(255, 255, 255);

            table.addCell(createTableCell(String.valueOf(i), bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(safe(d.getDesignation()), bgColor, TextAlignment.LEFT));
            table.addCell(createTableCell(safe(d.getPointChoc()), bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(d.getQuantite() != null ? String.valueOf(d.getQuantite()) : "1", bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(d.getEstOccasion() != null && d.getEstOccasion() ? "Oui" : "Non", bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(formatMontant(d.getTauxTva()) + "%", bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(formatMontant(d.getMontant()), bgColor, TextAlignment.RIGHT));
            i++;
        }

        document.add(table);
    }

    private void addMainOeuvreSection(Document document, ExpertReportHassen rapport) {
        List<MainOeuvreHassen> mains = rapport.getMainsOeuvre();
        if (mains == null || mains.isEmpty()) return;

        document.add(createSectionTitle("MAIN D'OEUVRE"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{5, 20, 35, 10, 30}))
                .useAllAvailableWidth().setMarginBottom(10);

        String[] headers = {"No", "Type Travail", "Description", "TVA %", "Montant (DT)"};
        for (String h : headers) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(BLUE_DARK)
                    .add(new Paragraph(h).setFontSize(8).setBold().setFontColor(ColorConstants.WHITE))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(5));
        }

        int i = 1;
        for (MainOeuvreHassen m : mains) {
            DeviceRgb bgColor = (i % 2 == 0) ? GRAY_LIGHT : new DeviceRgb(255, 255, 255);

            table.addCell(createTableCell(String.valueOf(i), bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(m.getTypeTravail() != null ? m.getTypeTravail().name() : "N/A", bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(safe(m.getDescription()), bgColor, TextAlignment.LEFT));
            table.addCell(createTableCell(formatMontant(m.getTauxTva()) + "%", bgColor, TextAlignment.CENTER));
            table.addCell(createTableCell(formatMontant(m.getMontant()), bgColor, TextAlignment.RIGHT));
            i++;
        }

        document.add(table);
    }

    private void addFinanceSection(Document document, ExpertReportHassen rapport) {
        document.add(createSectionTitle("FINANCE SUMMARY"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{60, 40}))
                .useAllAvailableWidth().setMarginBottom(15);

        addFinanceRow(table, "Total Fournitures HT", formatMontant(rapport.getTotalFournituresHT()), false);
        addFinanceRow(table, "TVA Fournitures (19%)", formatMontant(rapport.getTvaFournitures()), false);
        addFinanceRow(table, "Total Fournitures TTC", formatMontant(rapport.getTotalFournituresTTC()), false);
        addFinanceRow(table, "Total Main d'Oeuvre HT", formatMontant(rapport.getTotalMainOeuvreHT()), false);
        addFinanceRow(table, "Total Main d'Oeuvre TTC", formatMontant(rapport.getTotalMainOeuvreTTC()), false);

        table.addCell(new Cell(1, 2).setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(ColorConstants.GRAY, 1)).setHeight(5));

        addFinanceRow(table, "TOTAL GENERAL TTC", formatMontant(rapport.getTotalGeneral()), true);

        if (rapport.getVetuste() != null && rapport.getVetuste().compareTo(BigDecimal.ZERO) > 0) {
            addFinanceRowRed(table, "- Vetuste", formatMontant(rapport.getVetuste()));
        }
        if (rapport.getRemise() != null && rapport.getRemise().compareTo(BigDecimal.ZERO) > 0) {
            addFinanceRowRed(table, "- Remise", formatMontant(rapport.getRemise()));
        }

        table.addCell(new Cell(1, 2).setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(BLUE_DARK, 3)).setHeight(5));

        Cell labelNet = new Cell().setBorder(Border.NO_BORDER)
                .setBackgroundColor(BLUE_DARK).setPadding(10)
                .add(new Paragraph("TOTAL NET A PAYER")
                        .setFontSize(13).setBold().setFontColor(ColorConstants.WHITE));
        Cell valNet = new Cell().setBorder(Border.NO_BORDER)
                .setBackgroundColor(BLUE_DARK).setPadding(10)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(new Paragraph(formatMontant(rapport.getTotalNet()) + " DT")
                        .setFontSize(15).setBold().setFontColor(ColorConstants.WHITE));
        table.addCell(labelNet);
        table.addCell(valNet);

        document.add(table);
    }

    private void addPhotosSection(Document document, List<PhotoAccident> photos) {
        if (photos == null || photos.isEmpty()) return;

        document.add(createSectionTitle("PHOTOS D'ACCIDENT (" + photos.size() + " photo(s))"));

        Table table = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth().setMarginBottom(10);

        for (PhotoAccident photo : photos) {
            Cell cell = new Cell().setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f)).setPadding(5);
            try {
                java.nio.file.Path filePath = Paths.get(photo.getCheminFichier());
                if (Files.exists(filePath)) {
                    byte[] imageBytes = Files.readAllBytes(filePath);
                    Image img = new Image(ImageDataFactory.create(imageBytes))
                            .setWidth(UnitValue.createPercentValue(100))
                            .setAutoScale(true);
                    cell.add(img);
                } else {
                    cell.add(new Paragraph("[Image non disponible]").setFontSize(8)
                            .setFontColor(ColorConstants.GRAY).setTextAlignment(TextAlignment.CENTER));
                }
            } catch (Exception e) {
                cell.add(new Paragraph("[Erreur chargement image]").setFontSize(8)
                        .setFontColor(RED).setTextAlignment(TextAlignment.CENTER));
            }
            String legende = (photo.getTypePhoto() != null ? photo.getTypePhoto().name() : "PHOTO");
            if (photo.getDescription() != null && !photo.getDescription().isEmpty()) {
                legende += " — " + photo.getDescription();
            }
            cell.add(new Paragraph(legende).setFontSize(7).setFontColor(ColorConstants.DARK_GRAY)
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(3));
            table.addCell(cell);
        }

        if (photos.size() % 2 != 0) {
            table.addCell(new Cell().setBorder(Border.NO_BORDER));
        }
        document.add(table);
    }

    private void addConclusionSection(Document document, ExpertReportHassen rapport) {
        document.add(createSectionTitle("CONCLUSIONS"));

        if (rapport.getNatureDegats() != null && !rapport.getNatureDegats().isEmpty()) {
            document.add(new Paragraph("Nature des degats:")
                    .setFontSize(9).setBold().setFontColor(BLUE_DARK));
            document.add(new Paragraph(rapport.getNatureDegats())
                    .setFontSize(9).setMarginBottom(8));
        }

        if (rapport.getConclusions() != null && !rapport.getConclusions().isEmpty()) {
            document.add(new Paragraph("Conclusions de l'expert:")
                    .setFontSize(9).setBold().setFontColor(BLUE_DARK));
            document.add(new Paragraph(rapport.getConclusions())
                    .setFontSize(9).setMarginBottom(8)
                    .setBackgroundColor(BLUE_LIGHT).setPadding(8));
        }
    }

    private void addFooter(Document document, ExpertReportHassen rapport) {
        document.add(new Paragraph("")
                .setBorderBottom(new SolidBorder(ColorConstants.GRAY, 1))
                .setMarginTop(20).setMarginBottom(10));

        Table sigTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth();

        Cell sigLeft = new Cell().setBorder(Border.NO_BORDER);
        sigLeft.add(new Paragraph("Signature Expert").setFontSize(9).setBold());
        sigLeft.add(new Paragraph("\n\n\n_________________________").setFontSize(9));
        if (rapport.getExpert() != null) {
            sigLeft.add(new Paragraph(safe(rapport.getExpert().getLastName()) + " " + safe(rapport.getExpert().getFirstName()))
                    .setFontSize(8).setItalic());
        }

        Cell sigRight = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
        sigRight.add(new Paragraph("Cachet & Signature").setFontSize(9).setBold());
        sigRight.add(new Paragraph("\n\n\n_________________________").setFontSize(9));
        sigRight.add(new Paragraph(safe(rapport.getMandantAssurance()))
                .setFontSize(8).setItalic());

        sigTable.addCell(sigLeft);
        sigTable.addCell(sigRight);
        document.add(sigTable);

        document.add(new Paragraph("Document genere automatiquement par SALAMA INSURANCE PLATFORM - " + java.time.LocalDate.now().format(dateFormatter))
                .setFontSize(7).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(15));
    }

    private Paragraph createSectionTitle(String title) {
        return new Paragraph(title)
                .setFontSize(12).setBold().setFontColor(BLUE_DARK)
                .setBackgroundColor(BLUE_LIGHT)
                .setPadding(6).setMarginTop(10).setMarginBottom(5);
    }

    private void addInfoCell(Table table, String label, String value) {
        Cell cell = new Cell().setBorder(Border.NO_BORDER).setPadding(4);
        cell.add(new Paragraph(label).setFontSize(7).setFontColor(ColorConstants.GRAY));
        cell.add(new Paragraph(value).setFontSize(9).setBold());
        table.addCell(cell);
    }

    private Cell createTableCell(String text, DeviceRgb bgColor, TextAlignment align) {
        return new Cell()
                .setBackgroundColor(bgColor)
                .add(new Paragraph(text).setFontSize(8))
                .setTextAlignment(align)
                .setPadding(4)
                .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 0.5f));
    }

    private void addFinanceRow(Table table, String label, String amount, boolean isTotal) {
        float fontSize = isTotal ? 11 : 9;
        Paragraph labelParagraph = new Paragraph(label).setFontSize(fontSize);
        Paragraph valueParagraph = new Paragraph(amount + " DT").setFontSize(fontSize);
        if (isTotal) {
            labelParagraph.setBold();
            valueParagraph.setBold();
        }
        Cell labelCell = new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                .add(labelParagraph);
        Cell valCell = new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(valueParagraph);
        if (isTotal) {
            labelCell.setBackgroundColor(GRAY_LIGHT);
            valCell.setBackgroundColor(GRAY_LIGHT);
        }
        table.addCell(labelCell);
        table.addCell(valCell);
    }

    private void addFinanceRowRed(Table table, String label, String amount) {
        Cell labelCell = new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                .add(new Paragraph(label).setFontSize(9).setFontColor(RED));
        Cell valCell = new Cell().setBorder(Border.NO_BORDER).setPadding(4)
                .setTextAlignment(TextAlignment.RIGHT)
                .add(new Paragraph("- " + amount + " DT").setFontSize(9).setFontColor(RED));
        table.addCell(labelCell);
        table.addCell(valCell);
    }

    private DeviceRgb getStatutColor(ExpertiseStatus statut) {
        if (statut == null) return new DeviceRgb(128, 128, 128);
        switch (statut) {
            case EN_COURS: return ORANGE;
            case TERMINE: return BLUE_DARK;
            case VALIDE: return GREEN;
            case ANNULE: return RED;
            default: return new DeviceRgb(128, 128, 128);
        }
    }

    private String safe(String value) {
        return (value != null && !value.isEmpty()) ? value : "N/A";
    }

    private String formatDate(java.time.LocalDate date) {
        return date != null ? date.format(dateFormatter) : "N/A";
    }

    private String formatMontant(BigDecimal amount) {
        return amount != null ? String.format("%,.3f", amount) : "0.000";
    }
}

