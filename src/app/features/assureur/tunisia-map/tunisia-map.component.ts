import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as L from 'leaflet';

// Coordonnées des villes tunisiennes
const cityCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Tunis Centre': { lat: 36.8065, lng: 10.1815 },
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
  'Manouba': { lat: 36.8085, lng: 10.0955 },
  'Zaghouan': { lat: 36.4035, lng: 10.1425 }
};

@Component({
  selector: 'app-tunisia-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div id="tunisia-map" style="height: 500px; width: 100%; border-radius: 12px;"></div>
      <div class="map-stats">
        <div class="stat">
          <span class="stat-value">{{ claims.length || 0 }}</span>
          <span class="stat-label">Sinistres</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ citiesCount }}</span>
          <span class="stat-label">Villes</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container {
      position: relative;
      background: #f0f2f5;
      border-radius: 12px;
      padding: 10px;
    }
    #tunisia-map {
      height: 500px;
      width: 100%;
      border-radius: 8px;
    }
    .map-stats {
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      display: flex;
      gap: 20px;
    }
    .map-stats .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #185FA5;
    }
    .map-stats .stat-label {
      font-size: 11px;
      color: #666;
    }
  `]
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
    console.log('📊 Détails:', this.claims);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 500);
  }

  initMap(): void {
    const mapElement = document.getElementById('tunisia-map');
    if (!mapElement) {
      console.error('❌ Élément map non trouvé');
      return;
    }
    
    // Initialiser la carte
    this.map = L.map('tunisia-map').setView([34.5, 9.5], 6.5);
    
    // Fond de carte
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);
    
    if (!this.claims || this.claims.length === 0) {
      console.warn('⚠️ Aucun sinistre à afficher');
      return;
    }
    
    // Grouper les sinistres par ville
    const claimsByCity = new Map<string, any[]>();
    
    this.claims.forEach(claim => {
      const region = claim.region || 'Tunis Centre';
      if (!claimsByCity.has(region)) {
        claimsByCity.set(region, []);
      }
      claimsByCity.get(region)!.push(claim);
    });
    
    this.citiesCount = claimsByCity.size;
    console.log('📍 Villes avec sinistres:', Array.from(claimsByCity.keys()));
    
    // Ajouter un marqueur pour chaque ville
    claimsByCity.forEach((cityClaims, cityName) => {
      const coords = cityCoordinates[cityName] || cityCoordinates['Tunis Centre'];
      const count = cityClaims.length;
      
      // Couleur selon le nombre de sinistres
      let color = '#3B6D11';
      if (count > 5) color = '#A32D2D';
      else if (count > 2) color = '#FF8C00';
      
      const radius = Math.min(30, 12 + count * 3);
      
      // Cercle proportionnel
      const circle = L.circleMarker([coords.lat, coords.lng], {
        radius: radius,
        fillColor: color,
        color: '#fff',
        weight: 3,
        fillOpacity: 0.8
      }).addTo(this.map);
      
      // Popup avec la liste des sinistres
      let popupHtml = `
        <div style="min-width: 250px; max-width: 350px;">
          <div style="background: #185FA5; color: white; padding: 10px; border-radius: 8px 8px 0 0; text-align: center;">
            <strong>📍 ${cityName}</strong><br/>
            <span>${count} sinistre${count > 1 ? 's' : ''}</span>
          </div>
          <div style="max-height: 300px; overflow-y: auto; padding: 5px;">
      `;
      
      cityClaims.forEach(claim => {
        const urgencyColor = claim.urgencyScore > 70 ? '#A32D2D' : (claim.urgencyScore > 40 ? '#FF8C00' : '#3B6D11');
        popupHtml += `
          <div onclick="window.dispatchEvent(new CustomEvent('claimClick', {detail: ${claim.id}}))" 
               style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; background: white; margin: 5px 0; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <strong style="color: #185FA5;">${claim.reference}</strong>
              <span style="background: ${urgencyColor}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px;">
                ${claim.urgencyScore || 0}%
              </span>
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 5px;">
              📅 ${new Date(claim.openingDate).toLocaleDateString('fr-FR')} | 
              📌 ${this.getStatusLabel(claim.status)}
            </div>
          </div>
        `;
      });
      
      popupHtml += `
          </div>
          <div style="padding: 10px; text-align: center; border-top: 1px solid #eee;">
            <button onclick="window.dispatchEvent(new CustomEvent('regionClick', {detail: '${cityName}'}))" 
                    style="width: 100%; padding: 6px; background: #185FA5; color: white; border: none; border-radius: 6px; cursor: pointer;">
              Voir tous les sinistres de ${cityName}
            </button>
          </div>
        </div>
      `;
      
      circle.bindPopup(popupHtml);
    });
    
    // Ajuster la vue
    const bounds = L.latLngBounds(Object.values(cityCoordinates).map(c => [c.lat, c.lng]));
    this.map.fitBounds(bounds);
    
    // Écouter les événements
    window.addEventListener('regionClick', ((e: CustomEvent) => {
      this.regionSelected.emit(e.detail);
      this.router.navigate(['/claims'], { queryParams: { region: e.detail } });
    }) as EventListener);
    
    window.addEventListener('claimClick', ((e: CustomEvent) => {
      this.claimSelected.emit(e.detail);
      this.router.navigate(['/claims', e.detail]);
    }) as EventListener);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'OPENED': 'Ouvert',
      'ASSIGNED_TO_EXPERT': 'Assigné',
      'UNDER_EXPERTISE': 'En expertise',
      'CLOSED': 'Clôturé',
      'REJECTED': 'Rejeté'
    };
    return labels[status] || status;
  }
}