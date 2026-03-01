package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Entity.RepairShopLinda;
import org.example.salamainsurance.Service.GarageProximityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/garages")
public class GarageProximityController {

    private final GarageProximityService proximityService;

    public GarageProximityController(GarageProximityService proximityService) {
        this.proximityService = proximityService;
    }

    @GetMapping("/nearest")
    public List<GarageDto> getNearestGarages(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "3") int limit
    ) {
        List<RepairShopLinda> garages = proximityService.findNearestGarages(lat, lng, limit);

        return garages.stream()
                .map(g -> new GarageDto(
                        g.getId(),
                        g.getName(),
                        g.getLatitude(),
                        g.getLongitude()
                ))
                .toList();
    }

    // DTO simple
    public record GarageDto(Long id, String name, Double latitude, Double longitude) {}
}