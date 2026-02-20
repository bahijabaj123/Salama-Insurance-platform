package org.example.salamainsurance.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RepairShopLindaRequest(

        @NotBlank(message = "Le nom est obligatoire")
        String name,

        @NotBlank(message = "Le téléphone est obligatoire")
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

        // 🔴 AJOUT TRÈS IMPORTANT POUR LA CARTE
        Double latitude,
        Double longitude

) {}