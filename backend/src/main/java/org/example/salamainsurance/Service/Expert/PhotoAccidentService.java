package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.ExpertReportHassen;
import org.example.salamainsurance.Entity.Expert.PhotoAccident;
import org.example.salamainsurance.Repository.Expert.ExpertReportHassenRepository;
import org.example.salamainsurance.Repository.Expert.PhotoAccidentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PhotoAccidentService implements IPhotoAccidentService {

    private final PhotoAccidentRepository photoRepository;
    private final ExpertReportHassenRepository rapportRepository;

    @Value("${app.upload.dir:uploads/photos-accident}")
    private String uploadDir;

    public PhotoAccidentService(PhotoAccidentRepository photoRepository,
                                ExpertReportHassenRepository rapportRepository) {
        this.photoRepository = photoRepository;
        this.rapportRepository = rapportRepository;
    }

    // ===== UPLOAD UNE SEULE PHOTO =====
    @Override
    @Transactional
    public PhotoAccident uploadPhoto(Integer idRapport,
                                     MultipartFile file,
                                     PhotoAccident.TypePhoto typePhoto,
                                     String description) throws IOException {

        ExpertReportHassen rapport = rapportRepository.findById(idRapport)
                .orElseThrow(() -> new RuntimeException("Rapport non trouvé avec l'ID: " + idRapport));

        // Créer le dossier de destination si nécessaire
        String dossierRapport = uploadDir + "/" + idRapport;
        Path dossierPath = Paths.get(dossierRapport);
        if (!Files.exists(dossierPath)) {
            Files.createDirectories(dossierPath);
        }

        // Générer un nom de fichier unique
        String nomOriginal = file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo";
        String extension = nomOriginal.contains(".")
                ? nomOriginal.substring(nomOriginal.lastIndexOf("."))
                : ".jpg";
        String nomFichierUnique = UUID.randomUUID().toString()
                + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
                + extension;

        // Sauvegarder le fichier sur le disque
        Path cheminComplet = dossierPath.resolve(nomFichierUnique);
        Files.copy(file.getInputStream(), cheminComplet, StandardCopyOption.REPLACE_EXISTING);

        // Créer l'entité PhotoAccident
        PhotoAccident photo = new PhotoAccident();
        photo.setNomFichier(nomOriginal);
        photo.setCheminFichier(cheminComplet.toString());
        photo.setTypeMime(file.getContentType());
        photo.setTailleFichier(file.getSize());
        photo.setTypePhoto(typePhoto != null ? typePhoto : PhotoAccident.TypePhoto.AUTRE);
        photo.setDescription(description);
        photo.setDateUpload(LocalDateTime.now());
        photo.setRapport(rapport);

        return photoRepository.save(photo);
    }

    // ===== UPLOAD PLUSIEURS PHOTOS =====
    @Override
    @Transactional
    public List<PhotoAccident> uploadPhotos(Integer idRapport,
                                             List<MultipartFile> files,
                                             PhotoAccident.TypePhoto typePhoto,
                                             String description) throws IOException {
        List<PhotoAccident> photos = new ArrayList<>();
        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                photos.add(uploadPhoto(idRapport, file, typePhoto, description));
            }
        }
        return photos;
    }

    // ===== GET PAR RAPPORT =====
    @Override
    public List<PhotoAccident> getPhotosByRapport(Integer idRapport) {
        return photoRepository.findByRapport_IdRapport(idRapport);
    }

    // ===== GET PAR RAPPORT + TYPE =====
    @Override
    public List<PhotoAccident> getPhotosByRapportAndType(Integer idRapport, PhotoAccident.TypePhoto typePhoto) {
        return photoRepository.findByRapport_IdRapportAndTypePhoto(idRapport, typePhoto);
    }

    // ===== GET PAR ID =====
    @Override
    public PhotoAccident getPhotoById(Integer idPhoto) {
        return photoRepository.findById(idPhoto)
                .orElseThrow(() -> new RuntimeException("Photo non trouvée avec l'ID: " + idPhoto));
    }

    // ===== DELETE =====
    @Override
    @Transactional
    public void deletePhoto(Integer idPhoto) throws IOException {
        PhotoAccident photo = getPhotoById(idPhoto);

        // Supprimer le fichier du disque
        Path chemin = Paths.get(photo.getCheminFichier());
        if (Files.exists(chemin)) {
            Files.delete(chemin);
        }

        photoRepository.delete(photo);
    }

    // ===== COUNT =====
    @Override
    public long countPhotosByRapport(Integer idRapport) {
        return photoRepository.countByRapport_IdRapport(idRapport);
    }
}

