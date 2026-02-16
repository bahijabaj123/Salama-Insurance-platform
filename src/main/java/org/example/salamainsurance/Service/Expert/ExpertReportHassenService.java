package org.example.salamainsurance.Service.Expert;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.Entity.Expert.ExpertHassen;
import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Repository.Expert.ExpertHassenRepository;
import org.example.salamainsurance.Repository.Expert.ExpertReportHassenRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExpertReportHassenService implements IExpertReportHassenService {

    private final ExpertReportHassenRepository reportRepository;
    private final ExpertHassenRepository expertRepository;

    @Override
    public List<ExpertReportHassen> getReportsByExpertId(Integer expertId) {
        return reportRepository.findByExpert_IdExpert(expertId);
    }

    // CREATE
    public ExpertReportHassen createReport(Integer expertId, ExpertReportHassen report) {
        ExpertHassen expert = expertRepository.findById(expertId)
                .orElseThrow(() -> new RuntimeException("Expert not found"));
        report.setExpert(expert);
        return reportRepository.save(report);
    }

    // READ ALL
    public List<ExpertReportHassen> getAllReports() {
        return reportRepository.findAll();
    }

    // READ BY ID
    public ExpertReportHassen getReportById(Integer id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));
    }

    // UPDATE
    public ExpertReportHassen updateReport(Integer id, ExpertReportHassen newReport) {
        ExpertReportHassen report = getReportById(id);

        report.setActivityType(newReport.getActivityType());
        report.setDescription(newReport.getDescription());
        report.setStatus(newReport.getStatus());
        report.setStartDate(newReport.getStartDate());
        report.setEndDate(newReport.getEndDate());
        report.setImageLinks(newReport.getImageLinks());
        report.setDamageAnalysis(newReport.getDamageAnalysis());
        report.setAffectedParts(newReport.getAffectedParts());
        report.setSeverityLevel(newReport.getSeverityLevel());
        report.setCostEstimate(newReport.getCostEstimate());
        report.setConclusions(newReport.getConclusions());

        return reportRepository.save(report);
    }

    // DELETE
    public void deleteReport(Integer id) {
        reportRepository.deleteById(id);
    }
}
