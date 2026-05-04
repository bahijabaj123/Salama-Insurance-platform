package org.example.salamainsurance.DTO;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MechanicRequest(
        @NotBlank(message = "Le nom est obligatoire")
        String name,

        @NotBlank(message = "Le téléphone est obligatoire")
        @Pattern(regexp = "^(2|4|5|7|9)\\d{7}$", message = "Numéro tunisien invalide")
        String phone,

        @Email(message = "Format email invalide")
        String email,

        @NotBlank(message = "La ville est obligatoire")
        String city,

        String address,

        @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0")
        Double latitude,

        @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0")
        Double longitude
) {}
