package org.example.salamainsurance.DTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.example.salamainsurance.Entity.SOSRequest;

public record SOSRequestRequest(

        @NotNull(message = "Le type de service est obligatoire")
        SOSRequest.SOSType type,

        @NotBlank(message = "Le nom du client est obligatoire")
        String clientName,

        @NotBlank(message = "Le téléphone du client est obligatoire")
        @Pattern(
                regexp = "^(2|4|5|7|9)\\d{7}$",
                message = "Le numéro doit être tunisien (8 chiffres). Exemple: 22334455"
        )
        String clientPhone,

        @DecimalMin(value = "-90.0", message = "Latitude invalide")
        @DecimalMax(value = "90.0", message = "Latitude invalide")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude invalide")
        @DecimalMax(value = "180.0", message = "Longitude invalide")
        Double longitude,

        String description,

        SOSRequest.SOSStatus status,

        // ID du garage (quand type = GARAGE)
        Long garageId,

        // ID du mécanicien (quand type = MECANICIEN)
        Long mechanicId,

        // ID du remorqueur (quand type = REMORQUAGE)
        Long towTruckId

) {
    public SOSRequest.SOSStatus status() {
        return status != null ? status : SOSRequest.SOSStatus.EN_ATTENTE;
    }
}
