package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Service.Expert.ExpertHassenService;
import org.example.salamainsurance.Entity.Expert.ExpertStatus;
import org.example.salamainsurance.Entity.Expert.ExpertiseStatus;
import org.example.salamainsurance.Service.Expert.ExpertReportHassenService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║     EXPERT DASHBOARD — KPI, Scorecards, Gauges, Charts & Alerts       ║
 * ║     Tableau de bord professionnel type BI Dashboard                    ║
 * ║     Base URL : /api/expert-dashboard                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 *  GET /                     → Dashboard complet (toutes les sections)
 *  GET /cards                → Cartes KPI principales (chiffres clés)
 *  GET /gauges               → Jauges de performance (%)
 *  GET /charts               → Données pour graphiques (pie, bar, donut)
 *  GET /scorecards           → Scorecard par expert
 *  GET /alerts               → Alertes et anomalies
 *  GET /expert/{id}/fiche-complete → Fiche complète d'un expert
 *  GET /recherche?q=...      → Recherche globale
 */
@RestController
@RequestMapping("/api/expert-dashboard")
@CrossOrigin(origins = "*")
public class ExpertDashboardController {

    private final ExpertHassenService expertService;
    private final ExpertReportHassenService reportService;

    public ExpertDashboardController(ExpertHassenService expertService,
                                     ExpertReportHassenService reportService) {
        this.expertService = expertService;
        this.reportService = reportService;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  DASHBOARD COMPLET — GET /api/expert-dashboard                  ║
    // ║  Retourne TOUT le dashboard en une seule requête                ║
    // ║  (cards + gauges + charts + scorecards + alerts)                ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("")
    public ResponseEntity<Map<String, Object>> getDashboardComplet() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("titre", "Salama Insurance — Expert Dashboard");
        dashboard.put("date", LocalDate.now().toString());
        dashboard.put("cards", buildCards(experts, rapports));
        dashboard.put("gauges", buildGauges(experts, rapports));
        dashboard.put("charts", buildCharts(experts, rapports));
        dashboard.put("scorecards", buildScorecards(experts));
        dashboard.put("alerts", buildAlerts(experts, rapports));

        return ResponseEntity.ok(dashboard);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  CARDS KPI — GET /api/expert-dashboard/cards                    ║
    // ║  Les 6 cartes principales du dashboard                          ║
    // ║  ┌──────────┐ ┌──────────┐ ┌──────────┐                        ║
    // ║  │ 💰 10829 │ │ 📋 3     │ │ 👤 3     │                        ║
    // ║  │ Total Net│ │ Rapports │ │ Experts  │                        ║
    // ║  └──────────┘ └──────────┘ └──────────┘                        ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/cards")
    public ResponseEntity<List<Map<String, Object>>> getCards() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();
        return ResponseEntity.ok(buildCards(experts, rapports));
    }

    private List<Map<String, Object>> buildCards(List<ExpertHassen> experts, List<ExpertReportHassen> rapports) {
        long totalExperts = experts.size();
        long expertsActifs = experts.stream().filter(e -> e.getStatus() ==  ExpertStatus.ACTIVE).count();
        long totalRapports = rapports.size();
        long rapportsEnCours = countByStatut(rapports, ExpertiseStatus.EN_COURS);
        long rapportsValides = countByStatut(rapports, ExpertiseStatus.VALIDE);

        BigDecimal totalNet = sumField(rapports, ExpertReportHassen::getTotalNet);
        BigDecimal totalFournituresHT = sumField(rapports, ExpertReportHassen::getTotalFournituresHT);
        BigDecimal totalMainOeuvreHT = sumField(rapports, ExpertReportHassen::getTotalMainOeuvreHT);

        BigDecimal moyenneNet = BigDecimal.ZERO;
        long nbAvecMontant = rapports.stream().filter(r -> r.getTotalNet() != null).count();
        if (nbAvecMontant > 0) {
            moyenneNet = totalNet.divide(BigDecimal.valueOf(nbAvecMontant), 3, RoundingMode.HALF_UP);
        }

        List<Map<String, Object>> cards = new ArrayList<>();

        cards.add(buildCard("totalNetGlobal", "Total Net Global", totalNet, "DT",
                "success", "💰", "Montant total net de tous les rapports"));

        cards.add(buildCard("totalFournituresHT", "Fournitures HT", totalFournituresHT, "DT",
                "info", "🔧", "Total pièces de rechange hors taxe"));

        cards.add(buildCard("totalMainOeuvreHT", "Main d'Œuvre HT", totalMainOeuvreHT, "DT",
                "warning", "🛠️", "Total main d'œuvre hors taxe"));

        cards.add(buildCard("moyenneNetParRapport", "Moyenne / Rapport", moyenneNet, "DT",
                "primary", "📊", "Coût moyen net par rapport d'expertise"));

        cards.add(buildCard("totalRapports", "Total Rapports", BigDecimal.valueOf(totalRapports), "",
                "info", "📋", rapportsEnCours + " en cours, " + rapportsValides + " validés"));

        cards.add(buildCard("totalExperts", "Total Experts", BigDecimal.valueOf(totalExperts), "",
                "primary", "👤", expertsActifs + " actifs sur " + totalExperts));

        return cards;
    }

    private Map<String, Object> buildCard(String id, String label, BigDecimal value,
                                           String unite, String color, String icon, String description) {
        Map<String, Object> card = new LinkedHashMap<>();
        card.put("id", id);
        card.put("label", label);
        card.put("value", value);
        card.put("unite", unite);
        card.put("color", color);
        card.put("icon", icon);
        card.put("description", description);
        return card;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  GAUGES — GET /api/expert-dashboard/gauges                      ║
    // ║  Jauges de performance en pourcentage (compteurs visuels)        ║
    // ║      ┌─────────┐                                                ║
    // ║      │  69%    │  ← Taux de validation                          ║
    // ║      │ ██████░░│                                                 ║
    // ║      └─────────┘                                                ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/gauges")
    public ResponseEntity<List<Map<String, Object>>> getGauges() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();
        return ResponseEntity.ok(buildGauges(experts, rapports));
    }

    private List<Map<String, Object>> buildGauges(List<ExpertHassen> experts, List<ExpertReportHassen> rapports) {
        long totalRapports = rapports.size();
        long rapportsValides = countByStatut(rapports, ExpertiseStatus.VALIDE);
        long rapportsTermines = countByStatut(rapports, ExpertiseStatus.TERMINE);
        long rapportsEnCours = countByStatut(rapports, ExpertiseStatus.EN_COURS);
        long rapportsAnnules = countByStatut(rapports, ExpertiseStatus.ANNULE);

        long totalExperts = experts.size();
        long expertsActifs = experts.stream().filter(e -> e.getStatus() == ExpertStatus.ACTIVE).count();

        List<Map<String, Object>> gauges = new ArrayList<>();

        double tauxValidation = totalRapports > 0 ? (rapportsValides * 100.0 / totalRapports) : 0;
        gauges.add(buildGauge("tauxValidation", "Taux de Validation",
                round2(tauxValidation), 100, "%",
                getGaugeColor(tauxValidation), rapportsValides + "/" + totalRapports + " rapports validés"));

        double tauxCompletion = totalRapports > 0 ? ((rapportsTermines + rapportsValides) * 100.0 / totalRapports) : 0;
        gauges.add(buildGauge("tauxCompletion", "Taux de Complétion",
                round2(tauxCompletion), 100, "%",
                getGaugeColor(tauxCompletion),
                (rapportsTermines + rapportsValides) + "/" + totalRapports + " terminés ou validés"));

        double tauxActifs = totalExperts > 0 ? (expertsActifs * 100.0 / totalExperts) : 0;
        gauges.add(buildGauge("tauxExpertsActifs", "Experts Actifs",
                round2(tauxActifs), 100, "%",
                getGaugeColor(tauxActifs), expertsActifs + "/" + totalExperts + " experts actifs"));

        double chargeTravail = totalRapports > 0 ? (rapportsEnCours * 100.0 / totalRapports) : 0;
        gauges.add(buildGauge("chargeTravail", "Charge EN_COURS",
                round2(chargeTravail), 100, "%",
                getGaugeColorInverse(chargeTravail), rapportsEnCours + " rapport(s) en cours de traitement"));

        double tauxAnnulation = totalRapports > 0 ? (rapportsAnnules * 100.0 / totalRapports) : 0;
        gauges.add(buildGauge("tauxAnnulation", "Taux d'Annulation",
                round2(tauxAnnulation), 100, "%",
                getGaugeColorInverse(tauxAnnulation), rapportsAnnules + " rapport(s) annulé(s)"));

        return gauges;
    }

    private Map<String, Object> buildGauge(String id, String label, double value,
                                            double max, String unite, String color, String description) {
        Map<String, Object> gauge = new LinkedHashMap<>();
        gauge.put("id", id);
        gauge.put("label", label);
        gauge.put("value", value);
        gauge.put("max", max);
        gauge.put("unite", unite);
        gauge.put("color", color);
        gauge.put("description", description);
        return gauge;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  CHARTS — GET /api/expert-dashboard/charts                      ║
    // ║  Données prêtes pour graphiques (Pie, Bar, Donut)               ║
    // ║      🥧 Pie Chart    📊 Bar Chart    🍩 Donut Chart             ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getCharts() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();
        return ResponseEntity.ok(buildCharts(experts, rapports));
    }

    private Map<String, Object> buildCharts(List<ExpertHassen> experts, List<ExpertReportHassen> rapports) {
        Map<String, Object> charts = new LinkedHashMap<>();

        // ── PIE CHART : Répartition rapports par statut ──
      Map<String, Object> pieStatut = new LinkedHashMap<>();
      pieStatut.put("type", "pie");
      pieStatut.put("titre", "Rapports par Statut");
      List<Map<String, Object>> pieData = new ArrayList<>();
      for (ExpertiseStatus statut : ExpertiseStatus.values()) {
        long count = countByStatut(rapports, statut);
        Map<String, Object> slice = new LinkedHashMap<>();
        slice.put("label", statut.name());
        slice.put("value", count);
        slice.put("color", getStatutColor(statut));
        pieData.add(slice);
      }
      pieStatut.put("data", pieData);
      charts.put("rapportsParStatut", pieStatut);

        // ── DONUT CHART : Répartition experts par zone ──
        Map<String, Object> donutZone = new LinkedHashMap<>();
        donutZone.put("type", "donut");
        donutZone.put("titre", "Experts par Zone");
        Map<String, Long> parZone = experts.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getInterventionZone() != null ? e.getInterventionZone().name() : "NON_DEFINIE",
                        Collectors.counting()));
        List<Map<String, Object>> donutData = new ArrayList<>();
        parZone.forEach((zone, count) -> {
            Map<String, Object> slice = new LinkedHashMap<>();
            slice.put("label", zone);
            slice.put("value", count);
            donutData.add(slice);
        });
        donutZone.put("data", donutData);
        charts.put("expertsParZone", donutZone);

        // ── BAR CHART : Montant net par expert ──
        Map<String, Object> barMontant = new LinkedHashMap<>();
        barMontant.put("type", "bar");
        barMontant.put("titre", "Montant Net par Expert (DT)");
        List<Map<String, Object>> barData = experts.stream().map(e -> {
            BigDecimal totalNet = sumField(
                    reportService.getReportsByExpertId(e.getIdExpert()),
                    ExpertReportHassen::getTotalNet);
            Map<String, Object> bar = new LinkedHashMap<>();
            bar.put("label", e.getFirstName() + " " + e.getLastName());
            bar.put("value", totalNet);
            bar.put("color", "#3498db");
            return bar;
        }).collect(Collectors.toList());
        barMontant.put("data", barData);
        charts.put("montantNetParExpert", barMontant);

        // ── BAR CHART : Nombre de rapports par expert ──
        Map<String, Object> barRapports = new LinkedHashMap<>();
        barRapports.put("type", "bar");
        barRapports.put("titre", "Nombre de Rapports par Expert");
        List<Map<String, Object>> barRapData = experts.stream().map(e -> {
            int nbRapports = reportService.getReportsByExpertId(e.getIdExpert()).size();
            Map<String, Object> bar = new LinkedHashMap<>();
            bar.put("label", e.getFirstName() + " " + e.getLastName());
            bar.put("value", nbRapports);
            bar.put("color", "#2ecc71");
            return bar;
        }).collect(Collectors.toList());
        barRapports.put("data", barRapData);
        charts.put("rapportsParExpert", barRapports);

        // ── PIE CHART : Fournitures vs Main d'Œuvre ──
        BigDecimal totalFournitures = sumField(rapports, ExpertReportHassen::getTotalFournituresHT);
        BigDecimal totalMainOeuvre = sumField(rapports, ExpertReportHassen::getTotalMainOeuvreHT);
        Map<String, Object> pieFournitureMO = new LinkedHashMap<>();
        pieFournitureMO.put("type", "pie");
        pieFournitureMO.put("titre", "Fournitures vs Main d'Œuvre (HT)");
        pieFournitureMO.put("data", List.of(
                Map.of("label", "Fournitures HT", "value", totalFournitures, "color", "#e74c3c"),
                Map.of("label", "Main d'Œuvre HT", "value", totalMainOeuvre, "color", "#f39c12")
        ));
        charts.put("fournituresVsMainOeuvre", pieFournitureMO);

        // ── DONUT CHART : Experts Actifs vs Inactifs ──
        long actifs = experts.stream().filter(e -> e.getStatus() == ExpertStatus.ACTIVE).count();
        long inactifs = experts.size() - actifs;
        Map<String, Object> donutActif = new LinkedHashMap<>();
        donutActif.put("type", "donut");
        donutActif.put("titre", "Experts Actifs vs Inactifs");
        donutActif.put("data", List.of(
                Map.of("label", "ACTIVE", "value", actifs, "color", "#2ecc71"),
                Map.of("label", "INACTIVE", "value", inactifs, "color", "#e74c3c")
        ));
        charts.put("expertsActifsVsInactifs", donutActif);

        return charts;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  SCORECARDS — GET /api/expert-dashboard/scorecards              ║
    // ║  Scorecard de performance pour chaque expert                    ║
    // ║  ┌────────────────────────────────────────────────────┐         ║
    // ║  │ Houssem Makehli  │ ⭐ Score: 85/100  │ 🟢 TOP     │         ║
    // ║  └────────────────────────────────────────────────────┘         ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/scorecards")
    public ResponseEntity<List<Map<String, Object>>> getScorecards() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        return ResponseEntity.ok(buildScorecards(experts));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buildScorecards(List<ExpertHassen> experts) {
      return experts.stream().map(expert -> {
          List<ExpertReportHassen> rapports = reportService.getReportsByExpertId(expert.getIdExpert());
          int totalRapports = rapports.size();
          long rapportsValides = countByStatut(rapports, ExpertiseStatus.VALIDE);
          long rapportsEnCours = countByStatut(rapports, ExpertiseStatus.EN_COURS);
          long rapportsAnnules = countByStatut(rapports, ExpertiseStatus.ANNULE);
          BigDecimal totalNet = sumField(rapports, ExpertReportHassen::getTotalNet);


            int score = calculerScore(expert, totalRapports, rapportsValides, rapportsAnnules);
            String niveau = score >= 80 ? "EXCELLENT" : score >= 60 ? "BON" : score >= 40 ? "MOYEN" : "FAIBLE";
            String couleur = score >= 80 ? "#2ecc71" : score >= 60 ? "#3498db" : score >= 40 ? "#f39c12" : "#e74c3c";

            Map<String, Object> card = new LinkedHashMap<>();
            card.put("idExpert", expert.getIdExpert());
            card.put("nomComplet", expert.getFirstName() + " " + expert.getLastName());
            card.put("specialite", safe(expert.getSpecialty()));
            card.put("zone", expert.getInterventionZone());
            card.put("statut", expert.getStatus());
            card.put("experience", expert.getYearsOfExperience() != null ? expert.getYearsOfExperience() : 0);

            Map<String, Object> perf = new LinkedHashMap<>();
            perf.put("score", score);
            perf.put("max", 100);
            perf.put("niveau", niveau);
            perf.put("couleur", couleur);
            card.put("performance", perf);

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalRapports", totalRapports);
            stats.put("rapportsValides", rapportsValides);
            stats.put("rapportsEnCours", rapportsEnCours);
            stats.put("rapportsAnnules", rapportsAnnules);
            stats.put("montantTotalGere", totalNet);
            card.put("statistiques", stats);

            return card;
        })
        .sorted(Comparator.comparingInt(m -> -((int) ((Map<String, Object>) m.get("performance")).get("score"))))
        .collect(Collectors.toList());
    }

    private int calculerScore(ExpertHassen expert, int totalRapports, long valides, long annules) {
        int score = 0;
        score += Math.min(totalRapports * 10, 30);
        if (totalRapports > 0) {
            score += (int) (valides * 30.0 / totalRapports);
        }
        if (totalRapports > 0) {
            double tauxAnnul = annules * 100.0 / totalRapports;
            score += tauxAnnul == 0 ? 15 : tauxAnnul <= 10 ? 10 : tauxAnnul <= 25 ? 5 : 0;
        } else {
            score += 15;
        }
        int exp = expert.getYearsOfExperience() != null ? expert.getYearsOfExperience() : 0;
        score += Math.min(exp * 2, 15);
        if (expert.getStatus() == ExpertStatus.ACTIVE) {
            score += 10;
        }
        return Math.min(score, 100);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  ALERTS — GET /api/expert-dashboard/alerts                      ║
    // ║  🚨 Alertes intelligentes et anomalies détectées                ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/alerts")
    public ResponseEntity<Map<String, Object>> getAlerts() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();
        return ResponseEntity.ok(buildAlerts(experts, rapports));
    }

    private Map<String, Object> buildAlerts(List<ExpertHassen> experts, List<ExpertReportHassen> rapports) {
        LocalDate seuilDate = LocalDate.now().minusDays(30);
        List<Map<String, Object>> alertList = new ArrayList<>();

        // 🔴 CRITIQUE — Rapports sans expert assigné
        rapports.stream()
                .filter(r -> r.getExpert() == null)
                .forEach(r -> alertList.add(buildAlert("CRITIQUE", "🔴",
                        "Rapport sans expert",
                        "Rapport " + safe(r.getNumeroReference()) + " (ID:" + r.getIdRapport() + ") n'a aucun expert assigné",
                        Map.of("idRapport", r.getIdRapport(), "reference", safe(r.getNumeroReference())))));

        // 🟠 HAUTE — Rapports EN_COURS > 30 jours
        rapports.stream()
                .filter(r -> r.getStatutRapport() == ExpertiseStatus.EN_COURS
                        && r.getDateMission() != null && r.getDateMission().isBefore(seuilDate))
                .forEach(r -> {
                    long jours = java.time.temporal.ChronoUnit.DAYS.between(r.getDateMission(), LocalDate.now());
                    alertList.add(buildAlert("HAUTE", "🟠",
                            "Rapport en retard",
                            "Rapport " + safe(r.getNumeroReference()) + " est EN_COURS depuis " + jours + " jours",
                            Map.of("idRapport", r.getIdRapport(), "reference", safe(r.getNumeroReference()),
                                    "dateMission", r.getDateMission().toString(), "joursEcoules", jours)));
                });

        // 🟡 MOYENNE — Experts INACTIVE avec rapports EN_COURS
        experts.stream()
                .filter(e -> e.getStatus() == ExpertStatus.INACTIVE)
                .forEach(e -> {
                    long nbEnCours = reportService.getReportsByExpertId(e.getIdExpert()).stream()
                            .filter(r -> r.getStatutRapport() == ExpertiseStatus.EN_COURS).count();
                    if (nbEnCours > 0) {
                        alertList.add(buildAlert("MOYENNE", "🟡",
                                "Expert inactif avec dossiers ouverts",
                                e.getFirstName() + " " + e.getLastName() + " est INACTIVE mais a " + nbEnCours + " rapport(s) EN_COURS",
                                Map.of("idExpert", e.getIdExpert(), "nom", e.getFirstName() + " " + e.getLastName(),
                                        "nbRapportsEnCours", nbEnCours)));
                    }
                });

        // 🔵 INFO — Rapports sans totaux calculés
        rapports.stream()
                .filter(r -> r.getTotalNet() == null && r.getStatutRapport() != ExpertiseStatus.ANNULE)
                .forEach(r -> alertList.add(buildAlert("INFO", "🔵",
                        "Totaux non calculés",
                        "Rapport " + safe(r.getNumeroReference()) + " (ID:" + r.getIdRapport() + ") — totaux financiers non calculés",
                        Map.of("idRapport", r.getIdRapport(), "reference", safe(r.getNumeroReference())))));

        long critique = alertList.stream().filter(a -> "CRITIQUE".equals(a.get("severite"))).count();
        long haute = alertList.stream().filter(a -> "HAUTE".equals(a.get("severite"))).count();
        long moyenne = alertList.stream().filter(a -> "MOYENNE".equals(a.get("severite"))).count();
        long info = alertList.stream().filter(a -> "INFO".equals(a.get("severite"))).count();

        Map<String, Object> result = new LinkedHashMap<>();
        Map<String, Object> resume = new LinkedHashMap<>();
        resume.put("totalAlertes", alertList.size());
        resume.put("critique", critique);
        resume.put("haute", haute);
        resume.put("moyenne", moyenne);
        resume.put("info", info);
        result.put("resume", resume);
        result.put("alertes", alertList);

        return result;
    }

    private Map<String, Object> buildAlert(String severite, String icon, String titre,
                                            String message, Map<String, Object> details) {
        Map<String, Object> alert = new LinkedHashMap<>();
        alert.put("severite", severite);
        alert.put("icon", icon);
        alert.put("titre", titre);
        alert.put("message", message);
        alert.put("details", details);
        alert.put("date", LocalDate.now().toString());
        return alert;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  FICHE EXPERT COMPLÈTE                                          ║
    // ║  GET /api/expert-dashboard/expert/{id}/fiche-complete           ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/expert/{id}/fiche-complete")
    public ResponseEntity<Map<String, Object>> getFicheExpertComplete(@PathVariable Integer id) {
      ExpertHassen expert = expertService.getExpertById(id);
      List<ExpertReportHassen> rapports = reportService.getReportsByExpertId(id);

      int totalRapports = rapports.size();
      long nbValides = countByStatut(rapports, ExpertiseStatus.VALIDE);
      long nbEnCours = countByStatut(rapports, ExpertiseStatus.EN_COURS);
      long nbTermines = countByStatut(rapports, ExpertiseStatus.TERMINE);
      long nbAnnules = countByStatut(rapports, ExpertiseStatus.ANNULE);
      BigDecimal totalNet = sumField(rapports, ExpertReportHassen::getTotalNet);

      int score = calculerScore(expert, totalRapports, nbValides, nbAnnules);
        String niveau = score >= 80 ? "EXCELLENT" : score >= 60 ? "BON" : score >= 40 ? "MOYEN" : "FAIBLE";

        List<Map<String, Object>> derniers = rapports.stream()
                .sorted(Comparator.comparing(
                        (ExpertReportHassen r) -> r.getDateMission() != null ? r.getDateMission() : LocalDate.MIN)
                        .reversed())
                .limit(5)
                .map(r -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("idRapport", r.getIdRapport());
                    row.put("reference", r.getNumeroReference());
                    row.put("dateMission", r.getDateMission());
                    row.put("assure", r.getAssureNom());
                    row.put("vehicule", safe(r.getVehiculeMarque()) + " " + safe(r.getVehiculeType()));
                    row.put("immatriculation", r.getVehiculeImmatriculation());
                    row.put("statut", r.getStatutRapport());
                    row.put("totalNet", r.getTotalNet());
                    return row;
                })
                .collect(Collectors.toList());

        Map<String, Object> fiche = new LinkedHashMap<>();

        Map<String, Object> infoExpert = new LinkedHashMap<>();
        infoExpert.put("id", expert.getIdExpert());
        infoExpert.put("nom", expert.getLastName());
        infoExpert.put("prenom", expert.getFirstName());
        infoExpert.put("email", safe(expert.getEmail()));
        infoExpert.put("telephone", safe(expert.getPhone()));
        infoExpert.put("specialite", safe(expert.getSpecialty()));
        infoExpert.put("zone", expert.getInterventionZone());
        infoExpert.put("statut", expert.getStatus());
        infoExpert.put("experience", expert.getYearsOfExperience() != null ? expert.getYearsOfExperience() : 0);
        fiche.put("expert", infoExpert);

        Map<String, Object> perf = new LinkedHashMap<>();
        perf.put("score", score);
        perf.put("max", 100);
        perf.put("niveau", niveau);
        fiche.put("performance", perf);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRapports", totalRapports);
        stats.put("rapportsEnCours", nbEnCours);
        stats.put("rapportsTermines", nbTermines);
        stats.put("rapportsValides", nbValides);
        stats.put("rapportsAnnules", nbAnnules);
        stats.put("montantTotalGere", totalNet);
        double tauxValid = totalRapports > 0 ? round2(nbValides * 100.0 / totalRapports) : 0;
        stats.put("tauxValidation", tauxValid);
        fiche.put("statistiques", stats);

        Map<String, Object> chart = new LinkedHashMap<>();
        chart.put("type", "donut");
        chart.put("titre", "Répartition Rapports");
        chart.put("data", List.of(
                Map.of("label", "EN_COURS", "value", nbEnCours, "color", "#f39c12"),
                Map.of("label", "TERMINE", "value", nbTermines, "color", "#3498db"),
                Map.of("label", "VALIDE", "value", nbValides, "color", "#2ecc71"),
                Map.of("label", "ANNULE", "value", nbAnnules, "color", "#e74c3c")
        ));
        fiche.put("chart", chart);

        fiche.put("derniersRapports", derniers);

        return ResponseEntity.ok(fiche);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  KPI GLOBAL — GET /api/expert-dashboard/kpi                     ║
    // ║  Retourne TOUS les indicateurs clés en une seule requête        ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpiGlobal() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();

        // Section experts
        long totalExperts = experts.size();
        long expertsActifs = experts.stream().filter(e -> e.getStatus() ==  ExpertStatus.ACTIVE).count();
        long expertsInactifs = totalExperts - expertsActifs;

        Map<String, Long> repartitionZone = experts.stream()
                .collect(Collectors.groupingBy(
                        e -> e.getInterventionZone() != null ? e.getInterventionZone().name() : "NON_DEFINIE",
                        Collectors.counting()));

        Map<String, Object> expertsSection = new LinkedHashMap<>();
        expertsSection.put("totalExperts", totalExperts);
        expertsSection.put("expertsActifs", expertsActifs);
        expertsSection.put("expertsInactifs", expertsInactifs);
        expertsSection.put("repartitionParZone", repartitionZone);

        // Section rapports
      long totalRapports = rapports.size();
      long rapportsEnCours = countByStatut(rapports, ExpertiseStatus.EN_COURS);
      long rapportsTermines = countByStatut(rapports, ExpertiseStatus.TERMINE);
      long rapportsValides = countByStatut(rapports, ExpertiseStatus.VALIDE);
      long rapportsAnnules = countByStatut(rapports, ExpertiseStatus.ANNULE);
      BigDecimal totalNetGlobal = sumField(rapports, ExpertReportHassen::getTotalNet);

        Map<String, Object> rapportsSection = new LinkedHashMap<>();
        rapportsSection.put("totalRapports", totalRapports);
        rapportsSection.put("rapportsEnCours", rapportsEnCours);
        rapportsSection.put("rapportsTermines", rapportsTermines);
        rapportsSection.put("rapportsValides", rapportsValides);
        rapportsSection.put("rapportsAnnules", rapportsAnnules);
        rapportsSection.put("totalNetGlobal", totalNetGlobal);

        // Section finances
        BigDecimal totalFournituresHT = sumField(rapports, ExpertReportHassen::getTotalFournituresHT);
        BigDecimal totalMainOeuvreHT = sumField(rapports, ExpertReportHassen::getTotalMainOeuvreHT);
        BigDecimal totalGeneralTTC = sumField(rapports, ExpertReportHassen::getTotalGeneral);

        BigDecimal moyenneNet = BigDecimal.ZERO;
        long nbAvecMontant = rapports.stream().filter(r -> r.getTotalNet() != null).count();
        if (nbAvecMontant > 0) {
            moyenneNet = totalNetGlobal.divide(BigDecimal.valueOf(nbAvecMontant), 3, RoundingMode.HALF_UP);
        }

        Map<String, Object> financesSection = new LinkedHashMap<>();
        financesSection.put("totalFournituresHT", totalFournituresHT);
        financesSection.put("totalMainOeuvreHT", totalMainOeuvreHT);
        financesSection.put("totalGeneralTTC", totalGeneralTTC);
        financesSection.put("totalNetGlobal", totalNetGlobal);
        financesSection.put("moyenneNetParRapport", moyenneNet);

        Map<String, Object> kpi = new LinkedHashMap<>();
        kpi.put("experts", expertsSection);
        kpi.put("rapports", rapportsSection);
        kpi.put("finances", financesSection);
        kpi.put("calculeLe", LocalDate.now().toString());

        return ResponseEntity.ok(kpi);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  TOP EXPERTS — GET /api/expert-dashboard/top-experts?limit=5    ║
    // ║  Les N experts les plus actifs (triés par nombre de rapports)   ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/top-experts")
    public ResponseEntity<List<Map<String, Object>>> getTopExperts(
            @RequestParam(defaultValue = "5") int limit) {

        List<ExpertHassen> experts = expertService.getAllExperts();

        List<Map<String, Object>> result = experts.stream()
                .map(expert -> {
                    List<ExpertReportHassen> rapports = reportService.getReportsByExpertId(expert.getIdExpert());
                    long nbValides = countByStatut(rapports, ExpertiseStatus.VALIDE);
                    BigDecimal totalNet = sumField(rapports, ExpertReportHassen::getTotalNet);

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("idExpert", expert.getIdExpert());
                    row.put("nomComplet", expert.getFirstName() + " " + expert.getLastName());
                    row.put("specialite", safe(expert.getSpecialty()));
                    row.put("zone", expert.getInterventionZone());
                    row.put("statut", expert.getStatus());
                    row.put("totalRapports", rapports.size());
                    row.put("rapportsValides", nbValides);
                    row.put("totalNetGere", totalNet);
                    return row;
                })
                .sorted(Comparator.comparingInt(m -> -((Number) m.get("totalRapports")).intValue()))
                .limit(limit)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  RAPPORTS EN ATTENTE                                            ║
    // ║  GET /api/expert-dashboard/rapports-en-attente                  ║
    // ║  Tous les rapports EN_COURS à traiter                           ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/rapports-en-attente")
    public ResponseEntity<List<Map<String, Object>>> getRapportsEnAttente() {
        List<ExpertReportHassen> enCours = reportService.findByStatut(
          ExpertiseStatus.EN_COURS);

        List<Map<String, Object>> result = enCours.stream().map(r -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("idRapport", r.getIdRapport());
            row.put("numeroReference", r.getNumeroReference());
            row.put("dateMission", r.getDateMission());
            row.put("assureNom", r.getAssureNom());
            row.put("vehicule", safe(r.getVehiculeMarque()) + " " + safe(r.getVehiculeType()));
            row.put("immatriculation", r.getVehiculeImmatriculation());
            row.put("totalNet", r.getTotalNet());
            if (r.getExpert() != null) {
                row.put("expertNom", r.getExpert().getFirstName() + " " + r.getExpert().getLastName());
            } else {
                row.put("expertNom", "Non assigné");
            }
            return row;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  ACTIVITÉ PAR PÉRIODE                                           ║
    // ║  GET /api/expert-dashboard/activite?debut=...&fin=...           ║
    // ║  Nombre de rapports + montant sur une période donnée            ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/activite")
    public ResponseEntity<Map<String, Object>> getActivitePeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {

        List<ExpertReportHassen> rapports = reportService.findByPeriode(debut, fin);

      long nbEnCours  = countByStatut(rapports, ExpertiseStatus.EN_COURS);
      long nbTermines = countByStatut(rapports, ExpertiseStatus.TERMINE);
      long nbValides  = countByStatut(rapports, ExpertiseStatus.VALIDE);
      long nbAnnules  = countByStatut(rapports, ExpertiseStatus.ANNULE);

      BigDecimal totalNet = sumField(rapports, ExpertReportHassen::getTotalNet);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periode", Map.of("debut", debut.toString(), "fin", fin.toString()));
        result.put("totalRapports", rapports.size());
        result.put("parStatut", Map.of(
                "EN_COURS", nbEnCours,
                "TERMINE", nbTermines,
                "VALIDE", nbValides,
                "ANNULE", nbAnnules
        ));
        result.put("montantTotalNet", totalNet);

        return ResponseEntity.ok(result);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  ALERTES — GET /api/expert-dashboard/alertes                    ║
    // ║  Rapports sans expert, EN_COURS > 30j, experts inactifs         ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/alertes")
    public ResponseEntity<Map<String, Object>> getAlertes() {
        List<ExpertHassen> experts = expertService.getAllExperts();
        List<ExpertReportHassen> rapports = reportService.getAllReports();
        LocalDate seuilDate = LocalDate.now().minusDays(30);

        // Rapports sans expert assigné
        List<Map<String, Object>> sansExpert = rapports.stream()
                .filter(r -> r.getExpert() == null)
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("idRapport", r.getIdRapport());
                    m.put("reference", safe(r.getNumeroReference()));
                    m.put("statut", r.getStatutRapport() != null ? r.getStatutRapport().name() : "N/A");
                    return m;
                })
                .collect(Collectors.toList());

        // Rapports EN_COURS depuis plus de 30 jours
        List<Map<String, Object>> rapportsAnciens = rapports.stream()
                .filter(r -> r.getStatutRapport() == ExpertiseStatus.EN_COURS
                        && r.getDateMission() != null && r.getDateMission().isBefore(seuilDate))
                .map(r -> {
                    long jours = java.time.temporal.ChronoUnit.DAYS.between(r.getDateMission(), LocalDate.now());
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("idRapport", r.getIdRapport());
                    m.put("reference", safe(r.getNumeroReference()));
                    m.put("dateMission", r.getDateMission().toString());
                    m.put("joursEcoules", jours);
                    return m;
                })
                .collect(Collectors.toList());

        // Experts INACTIVE avec rapports EN_COURS
        List<Map<String, Object>> expertsInactifs = experts.stream()
                .filter(e -> e.getStatus() == ExpertStatus.INACTIVE)
                .map(e -> {
                    long nbEnCours = reportService.getReportsByExpertId(e.getIdExpert()).stream()
                            .filter(r -> r.getStatutRapport() == ExpertiseStatus.EN_COURS).count();
                    if (nbEnCours > 0) {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("idExpert", e.getIdExpert());
                        m.put("nom", e.getFirstName() + " " + e.getLastName());
                        m.put("nbRapportsEnCours", nbEnCours);
                        return m;
                    }
                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Map<String, Object> alertes = new LinkedHashMap<>();
        alertes.put("rapportsSansExpert", sansExpert);
        alertes.put("rapportsEnCoursDepuis30Jours", rapportsAnciens);
        alertes.put("expertsInactifsAvecRapportsEnCours", expertsInactifs);
        alertes.put("totalAlertes", sansExpert.size() + rapportsAnciens.size() + expertsInactifs.size());

        return ResponseEntity.ok(alertes);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  RÉPARTITION PAR ZONE GÉOGRAPHIQUE                              ║
    // ║  GET /api/expert-dashboard/repartition-zones                    ║
    // ║  Nombre d'experts + montant traité par zone                     ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/repartition-zones")
    public ResponseEntity<List<Map<String, Object>>> getRepartitionZones() {
        List<ExpertHassen> experts = expertService.getAllExperts();

        Map<String, List<ExpertHassen>> parZone = experts.stream()
                .collect(Collectors.groupingBy(e ->
                        e.getInterventionZone() != null ? e.getInterventionZone().name() : "NON_DEFINIE"));

        List<Map<String, Object>> result = parZone.entrySet().stream()
                .map(entry -> {
                    String zone = entry.getKey();
                    List<ExpertHassen> expertsZone = entry.getValue();

                    long nbActifs = expertsZone.stream()
                            .filter(e -> e.getStatus() == ExpertStatus.ACTIVE).count();

                    long totalRapportsZone = 0;
                    BigDecimal totalNetZone = BigDecimal.ZERO;

                    for (ExpertHassen e : expertsZone) {
                        List<ExpertReportHassen> rapports = reportService.getReportsByExpertId(e.getIdExpert());
                        totalRapportsZone += rapports.size();
                        totalNetZone = totalNetZone.add(sumField(rapports, ExpertReportHassen::getTotalNet));
                    }

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("zone", zone);
                    row.put("nombreExperts", expertsZone.size());
                    row.put("expertsActifs", nbActifs);
                    row.put("totalRapports", totalRapportsZone);
                    row.put("montantTotalTraite", totalNetZone);
                    return row;
                })
                .sorted(Comparator.comparingInt(m -> -((Number) m.get("nombreExperts")).intValue()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║  RECHERCHE GLOBALE                                              ║
    // ║  GET /api/expert-dashboard/recherche?q=peugeot                  ║
    // ╚══════════════════════════════════════════════════════════════════╝
    @GetMapping("/recherche")
    public ResponseEntity<Map<String, Object>> rechercheGlobale(@RequestParam String q) {
        String keyword = q.toLowerCase().trim();
        List<ExpertReportHassen> tous = reportService.getAllReports();

        List<Map<String, Object>> matches = tous.stream()
                .filter(r ->
                        contains(r.getNumeroReference(), keyword) ||
                        contains(r.getAssureNom(), keyword) ||
                        contains(r.getVehiculeImmatriculation(), keyword) ||
                        contains(r.getVehiculeMarque(), keyword) ||
                        contains(r.getTiersNom(), keyword) ||
                        contains(r.getMandantAssurance(), keyword))
                .map(r -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("idRapport", r.getIdRapport());
                    row.put("numeroReference", r.getNumeroReference());
                    row.put("assureNom", r.getAssureNom());
                    row.put("vehicule", safe(r.getVehiculeMarque()) + " " + safe(r.getVehiculeType()));
                    row.put("immatriculation", r.getVehiculeImmatriculation());
                    row.put("assurance", r.getMandantAssurance());
                    row.put("statut", r.getStatutRapport());
                    row.put("totalNet", r.getTotalNet());
                    return row;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("motCle", q);
        response.put("nombreResultats", matches.size());
        response.put("resultats", matches);
        return ResponseEntity.ok(response);
    }

    // ══════════════════════════════════════════════════════════════
    //  MÉTHODES UTILITAIRES PRIVÉES
    // ══════════════════════════════════════════════════════════════

  private long countByStatut(List<ExpertReportHassen> rapports, ExpertiseStatus statut) {
    return rapports.stream().filter(r -> r.getStatutRapport() == statut).count();
  }


    private BigDecimal sumField(List<ExpertReportHassen> rapports, java.util.function.Function<ExpertReportHassen, BigDecimal> extractor) {
        return rapports.stream()
                .filter(r -> extractor.apply(r) != null)
                .map(extractor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private boolean contains(String field, String keyword) {
        return field != null && field.toLowerCase().contains(keyword);
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String getGaugeColor(double percentage) {
        if (percentage >= 75) return "#2ecc71";
        if (percentage >= 50) return "#3498db";
        if (percentage >= 25) return "#f39c12";
        return "#e74c3c";
    }

    private String getGaugeColorInverse(double percentage) {
        if (percentage <= 10) return "#2ecc71";
        if (percentage <= 30) return "#f39c12";
        return "#e74c3c";
    }

  private String getStatutColor(ExpertiseStatus statut) {
    switch (statut) {
      case DRAFT:     return "#95a5a6";
      case SUBMITTED: return "#f39c12";
      case EN_COURS:  return "#f39c12";
      case TERMINE:   return "#3498db";
      case VALIDE:    return "#2ecc71";
      case REJETE:    return "#e74c3c";
      case ANNULE:    return "#e74c3c";
      default:        return "#95a5a6";
    }

    }

  @GetMapping("/available-experts")
  public ResponseEntity<List<ExpertHassen>> getAvailableExperts() {
    List<ExpertHassen> available = expertService.findByStatus(ExpertStatus.AVAILABLE);
    return ResponseEntity.ok(available);
  }

}
