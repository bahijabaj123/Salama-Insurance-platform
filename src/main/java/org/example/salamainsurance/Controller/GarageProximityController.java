package org.example.salamainsurance.Controller;

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
        var results = proximityService.findNearestGarages(lat, lng, limit);

        return results.stream()
                .map(r -> new GarageDto(
                        r.garage().getId(),
                        r.garage().getName(),
                        r.garage().getLatitude(),
                        r.garage().getLongitude(),
                        Math.round(r.distanceKm() * 100.0) / 100.0
                ))
                .toList();
    }

    // DTO avec distance en km
    public record GarageDto(Long id, String name, Double latitude, Double longitude, Double distanceKm) {}
}