import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { Claim, ClaimStatus, STATUS_LABELS, STATUS_BADGE_CSS } from '../../../core/models/claim.model';
import { FilterHasExpertPipe } from '../../../core/pipes/filter-has-expert.pipe';

Chart.register(...registerables);

@Component({
  selector: 'app-client-dashboard-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FilterHasExpertPipe
  ],
  templateUrl: './client-dashboard-home.component.html',  // ⚠️ On va créer ce fichier
  styleUrls: ['./client-dashboard.component.scss']  // ← Réutilise le CSS existant !
})
export class ClientDashboardHomeComponent implements OnInit, AfterViewInit {
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  
  loading = true;
  error = '';
  allClaims: Claim[] = [];
  private chart: any;

  constructor(
    private claimService: ClaimService,
    private authStorage: AuthStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    if (!this.loading && this.allClaims.length > 0) {
      this.initChart();
    }
  }

  clientName(): string {
    const user = this.authStorage.getUser();
    return user?.fullName || 'Client';
  }

  clientRef(): string {
    return 'SA-2024-00847';
  }

  get activeClaims(): Claim[] {
    return this.allClaims.filter(c => c.status !== ClaimStatus.CLOSED && c.status !== ClaimStatus.REJECTED);
  }

  get closedClaims(): Claim[] {
    return this.allClaims.filter(c => c.status === ClaimStatus.CLOSED);
  }

  get allClaimsWithExpert(): number {
    return this.allClaims.filter(c => c.expert).length;
  }

  get latestClaim(): Claim | null {
    return this.allClaims.length > 0 ? this.allClaims[0] : null;
  }

  kpis = [
    { label: 'En cours', value: '0', sub: 'Sinistres', color: '#FF8C00' },
    { label: 'Traitement moyen', value: '0j', sub: 'Délai estimé', color: '#185FA5' },
    { label: 'Taux résolution', value: '0%', sub: '+12% vs mois dernier', color: '#3B6D11' }
  ];

  timelineSteps = [
    { key: 'created', label: 'Déclaration' },
    { key: 'assigned', label: 'Expert assigné' },
    { key: 'expertise', label: 'Expertise' },
    { key: 'closed', label: 'Indemnisation' }
  ];

  STATUS_BADGE_CSS = STATUS_BADGE_CSS;
  STATUS_LABELS = STATUS_LABELS;

  loadData(): void {
  this.loading = true;
  this.error = '';

  const currentUser = this.authStorage.getUser();
  const clientId = currentUser?.id;
  const clientEmail = currentUser?.email;

  console.log('👤 HOME - Client connecté - ID:', clientId, 'Email:', clientEmail);

  this.claimService.getAllClaims().subscribe({
    next: (claims) => {
      // Filtrer par client ID
      let clientClaims: Claim[];
      
      if (clientId) {
        clientClaims = claims.filter(c => (c as any).client?.id === clientId);
      } else if (clientEmail) {
        clientClaims = claims.filter(c => (c as any).client?.email === clientEmail);
      } else {
        clientClaims = [];
      }

      console.log(`📊 HOME - ${clientClaims.length} sinistre(s) trouvé(s) pour le client`);
      
      this.allClaims = clientClaims;
      
      this.kpis = [
        { label: 'Sinistres actifs', value: this.activeClaims.length.toString(), sub: 'En cours', color: '#FF8C00' },
        { label: 'Expert assigné', value: this.allClaimsWithExpert.toString(), sub: 'Dossiers suivis', color: '#185FA5' },
        { label: 'Taux clôture', value: this.allClaims.length > 0 ? Math.round((this.closedClaims.length / this.allClaims.length) * 100) + '%' : '0%', sub: 'Sinistres résolus', color: '#3B6D11' }
      ];
      
      this.loading = false;
      setTimeout(() => this.initChart(), 100);
    },
    error: (err) => {
      console.error('❌ HOME - Erreur:', err);
      this.error = 'Erreur de chargement';
      this.loading = false;
    }
  });
}


  initChart(): void {
    if (!this.trendChartRef?.nativeElement) return;
    if (this.chart) this.chart.destroy();
    
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
    this.chart = new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Sinistres',
          data: [3, 5, 2, 4, 6, 3],
          borderColor: '#185FA5',
          backgroundColor: 'rgba(24, 95, 165, 0.1)',
          tension: 0.3,
          fill: true
        }]
      }
    });
  }

  getUrgencyClass(score: number): string {
    if (score > 70) return 'high';
    if (score > 40) return 'medium';
    return 'low';
  }

  getTimelineStepState(claim: Claim, stepKey: string): 'done' | 'active' | 'pending' {
    if (stepKey === 'created') return 'done';
    if (stepKey === 'assigned') return claim.expert ? 'done' : 'active';
    if (stepKey === 'expertise') return claim.status === ClaimStatus.UNDER_EXPERTISE ? 'active' : 'pending';
    if (stepKey === 'closed') return claim.status === ClaimStatus.CLOSED ? 'active' : 'pending';
    return 'pending';
  }

  getTimelineDate(claim: Claim, stepKey: string): string | null {
    if (stepKey === 'created') return new Date(claim.openingDate).toLocaleDateString();
    if (stepKey === 'assigned' && claim.assignedDate) return new Date(claim.assignedDate).toLocaleDateString();
    return null;
  }

  goToClaim(claimId: number): void {
    this.router.navigate(['/client/sinistres', claimId]);
  }

  goToClaimsList(): void {
    this.router.navigate(['/client/sinistres']);
  }

  openAssistant(): void {
    this.router.navigate(['/client/assistant']);
  }

  trackById(_: number, claim: Claim): number {
    return claim.id;
  }

  
}
