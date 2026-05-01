/*package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.DommageHassen;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.Expert.MainOeuvreHassen;
import org.example.salamainsurance.Repository.Expert.ExpertReportHassenRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RapportExpertisePdfServiceTest {

    @Test
    void genererPdfRapport_genereUnPdf() {
        ExpertReportHassenRepository repo = Mockito.mock(ExpertReportHassenRepository.class);
        RapportExpertisePdfService service = new RapportExpertisePdfService(repo);

        ExpertHassen expert = new ExpertHassen();
        expert.setFirstName("Sonia");
        expert.setLastName("Gharbi");
        expert.setEmail("sonia.gharbi@expertise-sfax.tn");
        expert.setPhone("74556677");
        expert.setSpecialty("Camions et Vehicules Lourds");

        DommageHassen dommage = new DommageHassen();
        dommage.setDesignation("Porte avant gauche");
        dommage.setPointChoc("Cote gauche");
        dommage.setMontant(new BigDecimal("680.000"));
        dommage.setTauxTva(new BigDecimal("19.00"));
        dommage.setEstOccasion(false);
        dommage.setQuantite(1);

        MainOeuvreHassen mainOeuvre = new MainOeuvreHassen();
        mainOeuvre.setTypeTravail(MainOeuvreHassen.TypeTravail.TOLERIE);
        mainOeuvre.setDescription("Redressage porte");
        mainOeuvre.setMontant(new BigDecimal("350.000"));
        mainOeuvre.setTauxTva(new BigDecimal("19.00"));

        ExpertReportHassen rapport = new ExpertReportHassen();
        rapport.setIdRapport(1);
        rapport.setNumeroReference("REF-SFAX-2026-042");
        rapport.setDateMission(LocalDate.of(2026, 2, 18));
        rapport.setDateAccident(LocalDate.of(2026, 2, 15));
        rapport.setDateExamen(LocalDate.of(2026, 2, 18));
        rapport.setLieuExamen("Centre Technique Sfax Sud");
        rapport.setObservation("Collision laterale");
        rapport.setAssureNom("Mehdi Bouzid");
        rapport.setAssureContrat("CT-98765");
        rapport.setAssureDossier("DOS-SFAX-2026-042");
        rapport.setMandantAssurance("GAT Assurances");
        rapport.setMandantAgence("Agence Sfax");
        rapport.setVehiculeMarque("Renault");
        rapport.setVehiculeType("Clio 4");
        rapport.setVehiculeImmatriculation("234SF567");
        rapport.setVehiculeCouleur("Rouge");
        rapport.setVehiculePuissance("5CV");
        rapport.setVehiculeEnergie(ExpertReportHassen.TypeEnergie.DIESEL);
        rapport.setVehiculeEtat(ExpertReportHassen.EtatVehicule.MOYEN);
        rapport.setVehiculeNumeroSerie("VF1BH2B0H55987654");
        rapport.setVehiculeDateMiseCirculation(LocalDate.of(2018, 9, 20));
        rapport.setVehiculeIndexKm(142000);
        rapport.setNatureDegats("Porte et aile endommagees");
        rapport.setConclusions("Vehicule reparable");
        rapport.setStatutRapport(ExpertReportHassen.StatutRapport.EN_COURS);
        rapport.setTotalFournituresHT(new BigDecimal("680.000"));
        rapport.setTvaFournitures(new BigDecimal("129.200"));
        rapport.setTotalFournituresTTC(new BigDecimal("809.200"));
        rapport.setTotalMainOeuvreHT(new BigDecimal("350.000"));
        rapport.setTotalMainOeuvreTTC(new BigDecimal("416.500"));
        rapport.setTotalGeneral(new BigDecimal("1225.700"));
        rapport.setTotalNet(new BigDecimal("1225.700"));
        rapport.setExpert(expert);
        rapport.setDommages(Collections.singletonList(dommage));
        rapport.setMainsOeuvre(Collections.singletonList(mainOeuvre));

        Mockito.when(repo.findById(1)).thenReturn(Optional.of(rapport));

        byte[] pdf = service.genererPdfRapport(1);

        assertNotNull(pdf);
        assertTrue(pdf.length > 100);
    }
}

*/
