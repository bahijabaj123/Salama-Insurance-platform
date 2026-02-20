package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.RepairShopLindaRequest;
import org.example.salamainsurance.Entity.RepairShopLinda;
import org.example.salamainsurance.Repository.RepairShopLindaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RepairShopLindaService {

    private final RepairShopLindaRepository repository;

    public RepairShopLindaService(RepairShopLindaRepository repository) {
        this.repository = repository;
    }

    public RepairShopLinda create(RepairShopLindaRequest request) {
        RepairShopLinda shop = new RepairShopLinda();
        applyRequest(shop, request); // ✅ copie tous les champs (dont lat/lng)
        return repository.save(shop);
    }

    @Transactional(readOnly = true)
    public RepairShopLinda getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("RepairShopLinda not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<RepairShopLinda> getAll() {
        return repository.findAll();
    }

    public RepairShopLinda update(Long id, RepairShopLindaRequest request) {
        RepairShopLinda shop = getById(id);
        applyRequest(shop, request); // ✅ met à jour tous les champs (dont lat/lng)
        return repository.save(shop);
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("RepairShopLinda not found: " + id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<RepairShopLinda> getPartnerShops() {
        return repository.findByPartnerTrue();
    }

    // ✅ méthode centrale pour éviter d’oublier des champs
    private void applyRequest(RepairShopLinda shop, RepairShopLindaRequest request) {
        shop.setName(request.name());
        shop.setPhone(request.phone());
        shop.setEmail(request.email());
        shop.setCity(request.city());
        shop.setAddress(request.address());
        shop.setPartner(request.partner());

        // ⭐⭐⭐ LIGNES QUI RÉGLENT TON PROBLÈME
        shop.setLatitude(request.latitude());
        shop.setLongitude(request.longitude());
    }
}