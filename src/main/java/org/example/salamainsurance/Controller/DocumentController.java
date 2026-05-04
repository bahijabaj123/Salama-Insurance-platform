package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.Document;
import org.example.salamainsurance.Service.DocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class DocumentController {

  @Autowired
  private DocumentService documentService;

  // Upload d'un document pour un sinistre
  @PostMapping("/upload/{claimId}")
  public ResponseEntity<?> uploadDocument(
    @PathVariable Long claimId,
    @RequestParam("file") MultipartFile file) {
    try {
      Document document = documentService.saveDocument(claimId, file);
      return ResponseEntity.ok(Map.of(
        "message", "Document uploaded successfully",
        "documentId", document.getId(),
        "fileName", document.getFileName()
      ));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
  }

  // Récupérer tous les documents d'un sinistre
  @GetMapping("/claim/{claimId}")
  public ResponseEntity<List<Document>> getDocumentsByClaim(@PathVariable Long claimId) {
    List<Document> documents = documentService.getDocumentsByClaimId(claimId);
    return ResponseEntity.ok(documents);
  }

  // Récupérer tous les documents d'un client (via ses sinistres)
  @GetMapping("/client/{clientId}")
  public ResponseEntity<List<Document>> getDocumentsByClient(@PathVariable Long clientId) {
    List<Document> documents = documentService.getDocumentsByClientId(clientId);
    return ResponseEntity.ok(documents);
  }

  // Télécharger un document
  @GetMapping("/download/{documentId}")
  public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) throws MalformedURLException {
    Resource resource = documentService.loadDocumentAsResource(documentId);
    Document document = documentService.getDocumentById(documentId);

    return ResponseEntity.ok()
      .contentType(MediaType.APPLICATION_PDF)
      .header(HttpHeaders.CONTENT_DISPOSITION,
        "attachment; filename=\"" + document.getFileName() + "\"")
      .body(resource);
  }

  // Prévisualiser un document
  @GetMapping("/preview/{documentId}")
  public ResponseEntity<Resource> previewDocument(@PathVariable Long documentId) throws MalformedURLException {
    Resource resource = documentService.loadDocumentAsResource(documentId);
    Document document = documentService.getDocumentById(documentId);

    return ResponseEntity.ok()
      .contentType(MediaType.APPLICATION_PDF)
      .header(HttpHeaders.CONTENT_DISPOSITION,
        "inline; filename=\"" + document.getFileName() + "\"")
      .body(resource);
  }

  // Supprimer un document
  @DeleteMapping("/{documentId}")
  public ResponseEntity<?> deleteDocument(@PathVariable Long documentId) {
    try {
      documentService.deleteDocument(documentId);
      return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
  }
}
