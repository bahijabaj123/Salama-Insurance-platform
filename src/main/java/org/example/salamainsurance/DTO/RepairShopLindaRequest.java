package org.example.salamainsurance.DTO;

public record RepairShopLindaRequest(
        String name,
        String phone,
        String email,
        String city,
        String address,
        Boolean partner
) {}
