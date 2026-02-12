package org.example.salamainsurance.Service;

import org.example.salamainsurance.DTO.RepairShopLindaRequest;
import org.example.salamainsurance.Entity.RepairShopLinda;
import org.example.salamainsurance.Repository.RepairShopLindaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class RepairShopLindaService {

    private final RepairShopLindaRepository repository;

    public RepairShopLindaService(RepairShopLindaRepository repository) {
        this.repository = repository;
    }

    public RepairShopLinda create(RepairShopLindaRequest request) {
        RepairShopLinda shop = new RepairShopLinda();
        shop.setName(request.name());
        shop.setPhone(request.phone());
        shop.setEmail(request.email());
        shop.setCity(request.city());
        shop.setAddress(request.address());
        shop.setPartner(request.partner() != null && request.partner());
        return repository.save(shop);
    }

    public RepairShopLinda getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("RepairShopLinda not found"));
    }

    public List<RepairShopLinda> getAll() {
        return repository.findAll();
    }

    @Transactional
    public RepairShopLinda update(Long id, RepairShopLindaRequest request) {
        RepairShopLinda shop = getById(id);

        if (request.name() != null) shop.setName(request.name());
        if (request.phone() != null) shop.setPhone(request.phone());
        if (request.email() != null) shop.setEmail(request.email());
        if (request.city() != null) shop.setCity(request.city());
        if (request.address() != null) shop.setAddress(request.address());
        if (request.partner() != null) shop.setPartner(request.partner());

        return shop;
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("RepairShopLinda not found");
        }
        repository.deleteById(id);
    }

    public List<RepairShopLinda> getPartnerShops() {
        return repository.findByPartnerTrue();
    }
}
