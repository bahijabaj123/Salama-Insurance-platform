package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.GarageAvailability;
import org.example.salamainsurance.Repository.GarageAvailabilityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GarageAvailabilityService {

    private final GarageAvailabilityRepository repository;

    public GarageAvailabilityService(GarageAvailabilityRepository repository) {
        this.repository = repository;
    }

    public List<GarageAvailabilityDto> getAvailability(Long garageId, LocalDate start, LocalDate end) {
        if (garageId == null) {
            throw new IllegalArgumentException("garageId is required");
        }
        if (start == null || end == null) {
            throw new IllegalArgumentException("start/end are required");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("end must be >= start");
        }

        List<GarageAvailability> rows = repository.findByGarageIdAndDateBetween(garageId, start, end);

        Map<LocalDate, GarageAvailability> byDate = new HashMap<>();
        for (GarageAvailability row : rows) {
            byDate.put(row.getDate(), row);
        }

        // Dates manquantes => disponibles par défaut.
        var result = new java.util.ArrayList<GarageAvailabilityDto>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            GarageAvailability found = byDate.get(d);
            // Règle: si la date n'existe pas en base => disponible par défaut (vert).
            // La gestion "jours passés" (blanc barré) se fait côté UI.
            boolean available = found == null || found.isAvailable();
            result.add(new GarageAvailabilityDto(d, available));
        }
        return result;
    }

    public record GarageAvailabilityDto(LocalDate date, boolean available) {
    }
}

