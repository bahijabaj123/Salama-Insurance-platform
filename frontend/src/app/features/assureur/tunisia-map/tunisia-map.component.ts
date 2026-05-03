import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';

const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Tunis': { lat: 36.8065, lng: 10.1815 },
  'Sfax': { lat: 34.7405, lng: 10.7605 },
  'Sousse': { lat: 35.8255, lng: 10.6365 },
  'Bizerte': { lat: 37.2740, lng: 9.8739 },
  'Nabeul': { lat: 36.4550, lng: 10.7350 },
  'Gabes': { lat: 33.8815, lng: 10.0985 },
  'Kairouan': { lat: 35.6781, lng: 10.0964 },
  'Monastir': { lat: 35.7645, lng: 10.8115 },
  'Ariana': { lat: 36.8601, lng: 10.1955 },
  'Ben Arous': { lat: 36.7525, lng: 10.2193 },
  'Manouba': { lat: 36.8085, lng: 10.0955 }
};

@Component({
  selector: 'app-tunisia-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="position: relative;">
      <div id="tunisia-map" style="height: 500px; width: 100%; border-radius: 12px;"></div>
      <div style="position: absolute; top: 20px; right: 20px; background: white; padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 1000;">
        <div><strong style="color: #185FA5;">{{ claims.length || 0 }}</strong> sinistres</div>
        <div><strong style="color: #185FA5;">{{ citiesCount }}</strong> villes</div>
      </div>
    </div>
  `
})
export class TunisiaMapComponent implements OnInit, AfterViewInit {
  @Input() claims: any[] = [];
  @Output() regionSelected = new EventEmitter<string>();
  @Output() claimSelected = new EventEmitter<number>();
  
  private map: any;
  citiesCount = 0;

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('📊 Carte - Sinistres reçus:', this.claims?.length);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  initMap(): void {
    const mapElement = document.getElementById('tunisia-map');
    if (!mapElement) return;
    
    this.map = L.map('tunisia-map').setView([34.5, 9.5], 6.5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    
    if (!this.claims || this.claims.length === 0) return;
    
    const claimsByCity = new Map<string, any[]>();
    
    this.claims.forEach(claim => {
      const region = claim.region || 'Tunis';
      if (!claimsByCity.has(region)) claimsByCity.set(region, []);
      claimsByCity.get(region)!.push(claim);
    });
    
    this.citiesCount = claimsByCity.size;
    
    claimsByCity.forEach((cityClaims, cityName) => {
      let coords = cityCoordinates[cityName];
      if (!coords) {
        console.warn(`⚠️ Ville non trouvée: ${cityName}`);
        coords = cityCoordinates['Tunis'];
      }
      
      const count = cityClaims.length;
      let color = '#3B6D11';
      if (count > 5) color = '#A32D2D';
      else if (count > 2) color = '#FF8C00';
      
      const radius = Math.min(30, 12 + count * 3);
      
      L.circleMarker([coords.lat, coords.lng], {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 3,
        fillOpacity: 0.8
      }).addTo(this.map)
       .bindPopup(`
         <div style="min-width: 200px;">
           <strong style="color: #185FA5;">${cityName}</strong><br/>
           ${count} sinistre(s)
         </div>
       `);
    });
  }
}