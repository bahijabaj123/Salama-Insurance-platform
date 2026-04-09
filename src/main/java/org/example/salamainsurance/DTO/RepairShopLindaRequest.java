package org.example.salamainsurance.DTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RepairShopLindaRequest(

        @NotBlank(message = "Le nom est obligatoire")
        String name,

        @NotBlank(message = "Le téléphone est obligatoire")
        @Pattern(
                regexp = "^(2|4|5|7|9)\\d{7}$",
                message = "Le numéro doit être tunisien (8 chiffres, commence par 2/4/5/7/9). Exemple: 22334455"
        )
        String phone,

        @NotBlank(message = "L'email est obligatoire")
        @Email(message = "Format email invalide")
        String email,

        @NotBlank(message = "La ville est obligatoire")
        String city,

        @NotBlank(message = "L'adresse est obligatoire")
        String address,

        @NotNull(message = "partner est obligatoire")
        Boolean partner,

        @NotNull(message = "La latitude est obligatoire")
        @DecimalMin(value = "-90.0", message = "Latitude invalide (min -90)")
        @DecimalMax(value = "90.0", message = "Latitude invalide (max 90)")
        Double latitude,

        @NotNull(message = "La longitude est obligatoire")
        @DecimalMin(value = "-180.0", message = "Longitude invalide (min -180)")
        @DecimalMax(value = "180.0", message = "Longitude invalide (max 180)")
        Double longitude

) {}
