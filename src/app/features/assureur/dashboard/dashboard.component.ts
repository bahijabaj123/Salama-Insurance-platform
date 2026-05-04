import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim, ClaimStatus, STATUS_LABELS } from '../../../core/models/claim.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { TunisiaMapComponent } from '../tunisia-map/tunisia-map.component';  
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatGridListModule,TunisiaMapComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('regionChart') regionChartRef!: ElementRef;
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('trendChart') trendChartRef!: ElementRef;
  @ViewChild('urgencyChart') urgencyChartRef!: ElementRef;

  loading = true;
 claims: Claim[] = [];
   chartsReady = false;

  // KPI
  totalClaims = 0;
  pendingClaims = 0;
  inProgressClaims = 0;
  closedClaims = 0;
  urgentClaims = 0;
  avgProcessingDays = 0;

  // Données pour graphiques
  regionData: { region: string; count: number }[] = [];
  monthlyData: { month: string; count: number }[] = [];
  urgencyDistribution = { low: 0, medium: 0, high: 0 };

  // Chart instances
  private regionChart!: Chart;
  private statusChart!: Chart;
  private trendChart!: Chart;
  private urgencyChart!: Chart;

  constructor(
    private claimService: ClaimService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    // Si les données sont déjà chargées, créer les graphiques
    if (!this.loading && this.claims.length > 0) {
      this.createCharts();
    }
  }

  loadData(): void {
    console.log('⏱️ [DASHBOARD] Début chargement -', new Date().toLocaleTimeString());
    const startTime = performance.now();
    
    this.loading = true;
    
    this.claimService.getAllClaims().subscribe({
      next: (claims) => {
        const apiTime = performance.now() - startTime;
        console.log(`⏱️ [DASHBOARD] API appelée en ${apiTime.toFixed(2)}ms - ${claims.length} sinistres`);
        
        this.claims = claims;
        this.calculateKPIs();
        this.prepareChartData();
        
        // Attendre que les graphiques soient prêts
        if (this.chartsReady) {
          this.createCharts();
        }
        
        this.loading = false;
        console.log(`⏱️ [DASHBOARD] TOTAL: ${(performance.now() - startTime).toFixed(2)}ms`);
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.loading = false;
      }
    });
  }
goToClaim(claimId: number): void {
  this.router.navigate(['/claims', claimId]);
}

  calculateKPIs(): void {
    this.totalClaims = this.claims.length;
    this.pendingClaims = this.claims.filter(c => c.status === 'OPENED').length;
    this.inProgressClaims = this.claims.filter(c => c.status === 'ASSIGNED_TO_EXPERT' || c.status === 'UNDER_EXPERTISE').length;
    this.closedClaims = this.claims.filter(c => c.status === 'CLOSED').length;
    this.urgentClaims = this.claims.filter(c => (c.urgencyScore || 0) > 70).length;
    
    // Temps moyen de traitement (simulation)
    this.avgProcessingDays = Math.floor(Math.random() * 15) + 5;
  }

  prepareChartData(): void {
    // 1. Données par région
    const regionMap = new Map<string, number>();
    this.claims.forEach(c => {
      if (c.region) {
        regionMap.set(c.region, (regionMap.get(c.region) || 0) + 1);
      }
    });
    this.regionData = Array.from(regionMap.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 2. Évolution mensuelle (6 derniers mois)
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthMap.set(monthKey, 0);
    }
    
    this.claims.forEach(c => {
      const date = new Date(c.openingDate);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (monthMap.has(monthKey)) {
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      }
    });
    
    this.monthlyData = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));


    // 3. Distribution des urgences
    this.urgencyDistribution = { low: 0, medium: 0, high: 0 };
    this.claims.forEach(c => {
      const score = c.urgencyScore || 0;
      if (score > 70) this.urgencyDistribution.high++;
      else if (score > 40) this.urgencyDistribution.medium++;
      else this.urgencyDistribution.low++;
    });
  }
 filterByRegion(region: string): void {
    this.router.navigate(['/claims'], { queryParams: { region } });
  }

  createCharts(): void {
    // Vérifier que les références existent
    if (!this.regionChartRef?.nativeElement || 
        !this.statusChartRef?.nativeElement || 
        !this.trendChartRef?.nativeElement || 
        !this.urgencyChartRef?.nativeElement) {
      console.warn('⚠️ Références non prêtes, report de la création');
      setTimeout(() => this.createCharts(), 100);
      return;
    }

    console.log('🎨 Création des graphiques...');
    const start = performance.now();

    try {
      // Détruire les anciens graphiques s'ils existent
      if (this.regionChart) this.regionChart.destroy();
      if (this.statusChart) this.statusChart.destroy();
      if (this.trendChart) this.trendChart.destroy();
      if (this.urgencyChart) this.urgencyChart.destroy();

      // Graphique 1: Camembert des sinistres par région
      this.regionChart = new Chart(this.regionChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: this.regionData.map(r => r.region),
          datasets: [{
            data: this.regionData.map(r => r.count),
            backgroundColor: ['#185FA5', '#FF8C00', '#3B6D11', '#A32D2D', '#17a2b8', '#6f42c1'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} sinistres` } }
          },
          onClick: (event, active) => {
            if (active.length > 0) {
              const index = active[0].index;
              const region = this.regionData[index].region;
              this.router.navigate(['/claims'], { queryParams: { region } });
            }
          }
        }
      });

      // Graphique 2: Barres des statuts
      const statusLabels = ['Ouverts', 'Assignés', 'En expertise', 'Clôturés', 'Rejetés'];
      const statusData = [
        this.claims.filter(c => c.status === 'OPENED').length,
        this.claims.filter(c => c.status === 'ASSIGNED_TO_EXPERT').length,
        this.claims.filter(c => c.status === 'UNDER_EXPERTISE').length,
        this.claims.filter(c => c.status === 'CLOSED').length,
        this.claims.filter(c => c.status === 'REJECTED').length
      ];

      this.statusChart = new Chart(this.statusChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: statusLabels,
          datasets: [{
            label: 'Nombre de sinistres',
            data: statusData,
            backgroundColor: '#185FA5',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          onClick: (event, active) => {
            if (active.length > 0) {
              const statusMap = ['OPENED', 'ASSIGNED_TO_EXPERT', 'UNDER_EXPERTISE', 'CLOSED', 'REJECTED'];
              const status = statusMap[active[0].index];
              this.router.navigate(['/claims'], { queryParams: { status } });
            }
          }
        }
      });

      // Graphique 3: Évolution (ligne)
      this.trendChart = new Chart(this.trendChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: this.monthlyData.map(m => m.month),
          datasets: [{
            label: 'Sinistres',
            data: this.monthlyData.map(m => m.count),
            borderColor: '#185FA5',
            backgroundColor: 'rgba(24, 95, 165, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#185FA5',
            pointRadius: 5,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });

      // Graphique 4: Jauge d'urgence (doughnut)
      this.urgencyChart = new Chart(this.urgencyChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Urgent (>70%)', 'Moyen (40-70%)', 'Normal (<40%)'],
          datasets: [{
            data: [this.urgencyDistribution.high, this.urgencyDistribution.medium, this.urgencyDistribution.low],
            backgroundColor: ['#A32D2D', '#FF8C00', '#3B6D11'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });

      console.log(`🎨 Graphiques créés en ${(performance.now() - start).toFixed(2)}ms`);
    } catch (error) {
      console.error('❌ Erreur création graphiques:', error);
    }
  }

  refreshData(): void {
    this.loadData();
  }

  goToClaims(): void {
    this.router.navigate(['/claims']);
  }

  filterByStatus(status: string): void {
    this.router.navigate(['/claims'], { queryParams: { status } });
  }
}