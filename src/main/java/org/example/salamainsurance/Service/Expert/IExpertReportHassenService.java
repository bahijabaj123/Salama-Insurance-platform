package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;

import java.util.List;

public interface IExpertReportHassenService {

    ExpertReportHassen createReport(Integer expertId, ExpertReportHassen report);

    List<ExpertReportHassen> getAllReports();

    ExpertReportHassen getReportById(Integer id);

    List<ExpertReportHassen> getReportsByExpertId(Integer expertId);

    ExpertReportHassen updateReport(Integer id, ExpertReportHassen report);

    void deleteReport(Integer id);
}
