package org.example.salamainsurance.Controller;

import org.example.salamainsurance.Service.GarageAvailabilityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/garages")
public class GarageAvailabilityController {

    private final GarageAvailabilityService service;

    public GarageAvailabilityController(GarageAvailabilityService service) {
        this.service = service;
    }

    @GetMapping("/{garageId}/availability")
    public List<GarageAvailabilityService.GarageAvailabilityDto> getAvailability(
            @PathVariable Long garageId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end
    ) {
        return service.getAvailability(garageId, start, end);
    }
}

