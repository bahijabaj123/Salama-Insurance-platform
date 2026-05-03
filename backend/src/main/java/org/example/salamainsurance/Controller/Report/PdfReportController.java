package org.example.salamainsurance.Controller.Report;

import org.example.salamainsurance.Service.Report.PdfReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class PdfReportController {

  @Autowired
  private PdfReportService pdfReportService;

  @GetMapping("/claim/{claimId}/pdf")
  public ResponseEntity<byte[]> generateClaimPdf(@PathVariable Long claimId) {
    try {
      byte[] pdfContent = pdfReportService.generateClaimReport(claimId);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_PDF);
      headers.setContentDispositionFormData("filename", "claim-" + claimId + ".pdf");
      headers.setContentLength(pdfContent.length);

      return ResponseEntity.ok()
        .headers(headers)
        .body(pdfContent);

    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }

  @GetMapping("/claim/{claimId}/pdf/download")
  public ResponseEntity<byte[]> downloadClaimPdf(@PathVariable Long claimId) {
    try {
      byte[] pdfContent = pdfReportService.generateClaimReport(claimId);

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_PDF);
      headers.setContentDispositionFormData("attachment", "claim-" + claimId + ".pdf");
      headers.setContentLength(pdfContent.length);

      return ResponseEntity.ok()
        .headers(headers)
        .body(pdfContent);

    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }
}
