package org.example.salamainsurance.Controller.Expert;

import org.example.salamainsurance.Entity.Expert.PhotoAccident;
import org.example.salamainsurance.Service.Expert.IPhotoAccidentService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/photos-accident")
@CrossOrigin(origins = "*")
public class PhotoAccidentController {

    private final IPhotoAccidentService photoService;

    public PhotoAccidentController(IPhotoAccidentService photoService) {
        this.photoService = photoService;
    }

    // ============================================================
    // POST /api/photos-accident/upload/{idRapport}
    // Upload UNE seule photo pour un rapport
    // Form-data: file (required), typePhoto (optional), description (optional)
    // ============================================================
    @PostMapping(value = "/upload/{idRapport}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadUnePhoto(
            @PathVariable Integer idRapport,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "typePhoto", required = false, defaultValue = "AUTRE") PhotoAccident.TypePhoto typePhoto,
            @RequestParam(value = "description", required = false) String description) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Le fichier est vide."));
        }

        // Vérifier que c'est bien une image
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Seules les images sont acceptées (jpeg, png, webp...)."));
        }

        try {
            PhotoAccident photo = photoService.uploadPhoto(idRapport, file, typePhoto, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(photo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur lors de l'enregistrement du fichier: " + e.getMessage()));
        }
    }

    // ============================================================
    // POST /api/photos-accident/upload-multiple/{idRapport}
    // Upload PLUSIEURS photos à la fois pour un rapport
    // Form-data: files[] (required), typePhoto (optional), description (optional)
    // ============================================================
    @PostMapping(value = "/upload-multiple/{idRapport}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPlusieursPhotos(
            @PathVariable Integer idRapport,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "typePhoto", required = false, defaultValue = "AUTRE") PhotoAccident.TypePhoto typePhoto,
            @RequestParam(value = "description", required = false) String description) {

        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Aucun fichier fourni."));
        }

        try {
            List<PhotoAccident> photos = photoService.uploadPhotos(idRapport, files, typePhoto, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", photos.size() + " photo(s) uploadée(s) avec succès.",
                    "photos", photos
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur upload: " + e.getMessage()));
        }
    }

    // ============================================================
    // GET /api/photos-accident/rapport/{idRapport}
    // Récupérer toutes les photos d'un rapport
    // ============================================================
    @GetMapping("/rapport/{idRapport}")
    public ResponseEntity<List<PhotoAccident>> getPhotosByRapport(@PathVariable Integer idRapport) {
        return ResponseEntity.ok(photoService.getPhotosByRapport(idRapport));
    }

    // ============================================================
    // GET /api/photos-accident/rapport/{idRapport}/type?typePhoto=AVANT_VEHICULE
    // Récupérer les photos d'un rapport filtrées par type
    // ============================================================
    @GetMapping("/rapport/{idRapport}/type")
    public ResponseEntity<List<PhotoAccident>> getPhotosByRapportAndType(
            @PathVariable Integer idRapport,
            @RequestParam PhotoAccident.TypePhoto typePhoto) {
        return ResponseEntity.ok(photoService.getPhotosByRapportAndType(idRapport, typePhoto));
    }

    // ============================================================
    // GET /api/photos-accident/{idPhoto}
    // Récupérer les métadonnées d'une photo par son ID
    // ============================================================
    @GetMapping("/{idPhoto}")
    public ResponseEntity<?> getPhotoById(@PathVariable Integer idPhoto) {
        try {
            return ResponseEntity.ok(photoService.getPhotoById(idPhoto));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ============================================================
    // GET /api/photos-accident/{idPhoto}/view
    // Afficher/télécharger le fichier image directement
    // ============================================================
    @GetMapping("/{idPhoto}/view")
    public ResponseEntity<Resource> viewPhoto(@PathVariable Integer idPhoto) {
        try {
            PhotoAccident photo = photoService.getPhotoById(idPhoto);
            Path filePath = Paths.get(photo.getCheminFichier());
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            String contentType = photo.getTypeMime() != null ? photo.getTypeMime() : "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + photo.getNomFichier() + "\"")
                    .body(resource);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (MalformedURLException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ============================================================
    // GET /api/photos-accident/rapport/{idRapport}/count
    // Compter le nombre de photos d'un rapport
    // ============================================================
    @GetMapping("/rapport/{idRapport}/count")
    public ResponseEntity<Map<String, Long>> countPhotos(@PathVariable Integer idRapport) {
        long count = photoService.countPhotosByRapport(idRapport);
        return ResponseEntity.ok(Map.of("nombrePhotos", count));
    }

    // ============================================================
    // DELETE /api/photos-accident/{idPhoto}
    // Supprimer une photo (DB + fichier disque)
    // ============================================================
    @DeleteMapping("/{idPhoto}")
    public ResponseEntity<?> deletePhoto(@PathVariable Integer idPhoto) {
        try {
            photoService.deletePhoto(idPhoto);
            return ResponseEntity.ok(Map.of("message", "Photo supprimée avec succès."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("erreur", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("erreur", "Erreur lors de la suppression du fichier: " + e.getMessage()));
        }
    }

    // ============================================================
    // GET /api/photos-accident/types
    // Lister tous les types de photos disponibles
    // ============================================================
    @GetMapping("/types")
    public ResponseEntity<PhotoAccident.TypePhoto[]> getTypesPhoto() {
        return ResponseEntity.ok(PhotoAccident.TypePhoto.values());
    }
}

