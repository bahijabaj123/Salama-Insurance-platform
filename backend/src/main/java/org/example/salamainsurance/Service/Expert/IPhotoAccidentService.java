package org.example.salamainsurance.Service.Expert;

import org.example.salamainsurance.Entity.Expert.PhotoAccident;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface IPhotoAccidentService {

    // Upload une seule photo liée à un rapport
    PhotoAccident uploadPhoto(Integer idRapport,
                              MultipartFile file,
                              PhotoAccident.TypePhoto typePhoto,
                              String description) throws IOException;

    // Upload plusieurs photos à la fois
    List<PhotoAccident> uploadPhotos(Integer idRapport,
                                     List<MultipartFile> files,
                                     PhotoAccident.TypePhoto typePhoto,
                                     String description) throws IOException;

    // Récupérer toutes les photos d'un rapport
    List<PhotoAccident> getPhotosByRapport(Integer idRapport);

    // Récupérer les photos d'un rapport par type
    List<PhotoAccident> getPhotosByRapportAndType(Integer idRapport, PhotoAccident.TypePhoto typePhoto);

    // Récupérer une photo par ID
    PhotoAccident getPhotoById(Integer idPhoto);

    // Supprimer une photo
    void deletePhoto(Integer idPhoto) throws IOException;

    // Compter les photos d'un rapport
    long countPhotosByRapport(Integer idRapport);
}

