package org.example.salamainsurance.Controller.Expert;

import lombok.RequiredArgsConstructor;
import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Service.Expert.ExpertReportHassenService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ExpertReportHassenController {

    private final ExpertReportHassenService reportService;

    @PostMapping("/{expertId}")
    public ExpertReportHassen create(@PathVariable Integer expertId,
            @RequestBody ExpertReportHassen report) {
        return reportService.createReport(expertId, report);
    }

    @GetMapping
    public List<ExpertReportHassen> getAll() {
        return reportService.getAllReports();
    }

    @GetMapping("/{id}")
    public ExpertReportHassen getById(@PathVariable Integer id) {
        return reportService.getReportById(id);
    }

    @PutMapping("/{id}")
    public ExpertReportHassen update(@PathVariable Integer id,
            @RequestBody ExpertReportHassen report) {
        return reportService.updateReport(id, report);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        reportService.deleteReport(id);
    }
}
