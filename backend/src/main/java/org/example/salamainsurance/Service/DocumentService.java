package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.ClaimManagement.Claim;
import org.example.salamainsurance.Entity.Document;
import org.example.salamainsurance.Repository.ClaimManagement.ClaimRepository;
import org.example.salamainsurance.Repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class DocumentService {

  @Autowired
  private DocumentRepository documentRepository;

  @Autowired
  private ClaimRepository claimRepository;

  private final String uploadDir = "uploads/documents/";

  public Document saveDocument(Long claimId, MultipartFile file) throws IOException {
    // Vérifier que le claim existe
    Claim claim = claimRepository.findById(claimId)
      .orElseThrow(() -> new RuntimeException("Claim not found: " + claimId));

    // Créer le répertoire s'il n'existe pas
    File directory = new File(uploadDir);
    if (!directory.exists()) {
      directory.mkdirs();
    }

    // Générer un nom de fichier unique
    String originalFileName = file.getOriginalFilename();
    String extension = "";
    if (originalFileName != null && originalFileName.contains(".")) {
      extension = originalFileName.substring(originalFileName.lastIndexOf("."));
    }
    String fileName = "claim_" + claimId + "_" + System.currentTimeMillis() + extension;
    String filePath = uploadDir + fileName;

    // Sauvegarder le fichier
    file.transferTo(new File(filePath));

    // Créer l'entité Document
    Document document = new Document();
    document.setFileName(originalFileName);
    document.setFileType(file.getContentType());
    document.setFileSize(file.getSize());
    document.setFilePath(filePath);
    document.setClaimId(claimId);

    return documentRepository.save(document);
  }

  public List<Document> getDocumentsByClaimId(Long claimId) {
    return documentRepository.findByClaimId(claimId);
  }

  public List<Document> getDocumentsByClientId(Long clientId) {
    return documentRepository.findByClientId(clientId);
  }

  public Document getDocumentById(Long documentId) {
    return documentRepository.findById(documentId)
      .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));
  }

  public Resource loadDocumentAsResource(Long documentId) throws MalformedURLException {
    Document document = getDocumentById(documentId);
    Path filePath = Paths.get(document.getFilePath());
    Resource resource = new UrlResource(filePath.toUri());

    if (resource.exists() && resource.isReadable()) {
      return resource;
    } else {
      throw new RuntimeException("Could not read file: " + document.getFileName());
    }
  }

  public void deleteDocument(Long documentId) throws IOException {
    Document document = getDocumentById(documentId);

    // Supprimer le fichier physique
    File file = new File(document.getFilePath());
    if (file.exists()) {
      file.delete();
    }

    // Supprimer l'entrée en base
    documentRepository.delete(document);
  }
}
