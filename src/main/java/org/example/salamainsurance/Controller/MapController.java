package org.example.salamainsurance.Controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MapController {

    @GetMapping("/map-client-garages")
    public String showMap() {
        return "map"; // map.html
    }
}