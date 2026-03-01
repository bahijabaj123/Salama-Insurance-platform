package org.example.salamainsurance.Service;

import org.example.salamainsurance.Entity.RepairShopLinda;
import org.example.salamainsurance.Repository.RepairShopLindaRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class GarageProximityService {

    private final RepairShopLindaRepository repairShopLindaRepository;

    public GarageProximityService(RepairShopLindaRepository repairShopLindaRepository) {
        this.repairShopLindaRepository = repairShopLindaRepository;
    }

    public List<RepairShopLinda> findNearestGarages(double clientLat, double clientLng, int limit) {
        List<RepairShopLinda> allGarages = repairShopLindaRepository.findAll();

        return allGarages.stream()
                .filter(g -> g.getLatitude() != null && g.getLongitude() != null)
                .sorted(Comparator.comparingDouble(
                        g -> distanceInKm(clientLat, clientLng, g.getLatitude(), g.getLongitude())
                ))
                .limit(limit)
                .toList();
    }

    // Haversine
    private double distanceInKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // rayon de la Terre en km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                                Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}