package org.example.salamainsurance.Controller;

import org.example.salamainsurance.DTO.RepairShopLindaRequest;
import org.example.salamainsurance.Entity.RepairShopLinda;
import org.example.salamainsurance.Service.RepairShopLindaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/repair-shops-linda")
public class RepairShopLindaController {

    private final RepairShopLindaService service;

    public RepairShopLindaController(RepairShopLindaService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RepairShopLinda create(@RequestBody RepairShopLindaRequest request) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public RepairShopLinda get(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping
    public List<RepairShopLinda> getAll() {
        return service.getAll();
    }

    @PutMapping("/{id}")
    public RepairShopLinda update(@PathVariable Long id,
                                  @RequestBody RepairShopLindaRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @GetMapping("/partners")
    public List<RepairShopLinda> getPartners() {
        return service.getPartnerShops();
    }
}
