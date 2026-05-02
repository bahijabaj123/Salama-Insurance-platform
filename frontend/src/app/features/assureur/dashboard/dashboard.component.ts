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

// ─── Import Chart.js avec types explicites ────────────────────────────────────
import {
  Chart, registerables,
  ChartEvent, ActiveElement, TooltipItem,
} from 'chart.js';
import { TunisiaMapComponent } from '../tunisia-map/tunisia-map.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatGridListModule, TunisiaMapComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('regionChart')  regionChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart')  statusChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart')   trendChartRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('urgencyChart') urgencyChartRef!: ElementRef<HTMLCanvasElement>;

  loading     = true;
  claims: Claim[] = [];
  chartsReady = false;

  // KPI
  totalClaims       = 0;
  pendingClaims     = 0;
  inProgressClaims  = 0;
  closedClaims      = 0;
  urgentClaims      = 0;
  avgProcessingDays = 0;

  regionData:  { region: string; count: number }[]  = [];
  monthlyData: { month: string;  count: number }[]  = [];
  urgencyDistribution = { low: 0, medium: 0, high: 0 };

  private regionChart!:  Chart;
  private statusChart!:  Chart;
  private trendChart!:   Chart;
  private urgencyChart!: Chart;

  constructor(
    private claimService: ClaimService,
    private router: Router,
  ) {}

  ngOnInit(): void     { this.loadData(); }
  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (!this.loading && this.claims.length > 0) this.createCharts();
  }

  loadData(): void {
    this.loading = true;
    this.claimService.getAllClaims().subscribe({
      next: (claims) => {
        this.claims = claims;
        this.calculateKPIs();
        this.prepareChartData();
        if (this.chartsReady) this.createCharts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur dashboard:', err);
        this.loading = false;
      },
    });
  }

  // ⭐ CORRIGÉ : Ajout de /assureur
  goToClaim(claimId: number): void {
    this.router.navigate(['/assureur/claims', claimId]);
  }

  calculateKPIs(): void {
    this.totalClaims      = this.claims.length;
    this.pendingClaims    = this.claims.filter(c => c.status === ClaimStatus.OPENED).length;
    this.inProgressClaims = this.claims.filter(c =>
      c.status === ClaimStatus.ASSIGNED_TO_EXPERT ||
      c.status === ClaimStatus.UNDER_EXPERTISE
    ).length;
    this.closedClaims  = this.claims.filter(c => c.status === ClaimStatus.CLOSED).length;
    this.urgentClaims  = this.claims.filter(c => (c.urgencyScore ?? 0) > 70).length;
    this.avgProcessingDays = Math.floor(Math.random() * 15) + 5;
  }

  prepareChartData(): void {
    // Par région
    const regionMap = new Map<string, number>();
    this.claims.forEach(c => {
      if (c.region) regionMap.set(c.region, (regionMap.get(c.region) ?? 0) + 1);
    });
    this.regionData = Array.from(regionMap.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Évolution mensuelle
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      monthMap.set(key, 0);
    }
    this.claims.forEach(c => {
      const d   = new Date(c.openingDate);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
    });
    this.monthlyData = Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));

    // Distribution urgence
    this.urgencyDistribution = { low: 0, medium: 0, high: 0 };
    this.claims.forEach(c => {
      const s = c.urgencyScore ?? 0;
      if (s > 70)      this.urgencyDistribution.high++;
      else if (s > 40) this.urgencyDistribution.medium++;
      else             this.urgencyDistribution.low++;
    });
  }

  // ⭐ CORRIGÉ : Ajout de /assureur
  filterByRegion(region: string): void {
    this.router.navigate(['/assureur/claims'], { queryParams: { region } });
  }

  createCharts(): void {
    if (
      !this.regionChartRef?.nativeElement  ||
      !this.statusChartRef?.nativeElement  ||
      !this.trendChartRef?.nativeElement   ||
      !this.urgencyChartRef?.nativeElement
    ) {
      setTimeout(() => this.createCharts(), 100);
      return;
    }

    // Détruire les anciens
    this.regionChart?.destroy();
    this.statusChart?.destroy();
    this.trendChart?.destroy();
    this.urgencyChart?.destroy();

    // ── Graphique 1 : Camembert régions ──────────────────────────────────
    this.regionChart = new Chart(this.regionChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels:   this.regionData.map(r => r.region),
        datasets: [{
          data:            this.regionData.map(r => r.count),
          backgroundColor: ['#185FA5','#FF8C00','#3B6D11','#A32D2D','#17a2b8','#6f42c1'],
          borderWidth:     0,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (ctx: TooltipItem<'pie'>) =>
                `${ctx.label}: ${ctx.raw} sinistres`,
            },
          },
        },
        // ⭐ CORRIGÉ : Ajout de /assureur
        onClick: (_event: ChartEvent, active: ActiveElement[]) => {
          if (active.length > 0) {
            const region = this.regionData[active[0].index].region;
            this.router.navigate(['/assureur/claims'], { queryParams: { region } });
          }
        },
      },
    });

    // ── Graphique 2 : Barres statuts ─────────────────────────────────────
    const statusMap = [
      ClaimStatus.OPENED,
      ClaimStatus.ASSIGNED_TO_EXPERT,
      ClaimStatus.UNDER_EXPERTISE,
      ClaimStatus.CLOSED,
      ClaimStatus.REJECTED,
    ];
    const statusLabels = ['Ouverts','Assignés','En expertise','Clôturés','Rejetés'];
    const statusData   = statusMap.map(s => this.claims.filter(c => c.status === s).length);

    this.statusChart = new Chart(this.statusChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels:   statusLabels,
        datasets: [{
          label:           'Nombre de sinistres',
          data:            statusData,
          backgroundColor: '#185FA5',
          borderRadius:    8,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        // ⭐ CORRIGÉ : Ajout de /assureur
        onClick: (_event: ChartEvent, active: ActiveElement[]) => {
          if (active.length > 0) {
            const status = statusMap[active[0].index];
            this.router.navigate(['/assureur/claims'], { queryParams: { status } });
          }
        },
      },
    });

    // ── Graphique 3 : Ligne évolution mensuelle ───────────────────────────
    this.trendChart = new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels:   this.monthlyData.map(m => m.month),
        datasets: [{
          label:              'Sinistres',
          data:               this.monthlyData.map(m => m.count),
          borderColor:        '#185FA5',
          backgroundColor:    'rgba(24, 95, 165, 0.1)',
          tension:            0.4,
          fill:               true,
          pointBackgroundColor: '#185FA5',
          pointRadius:          5,
          pointHoverRadius:     8,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });

    // ── Graphique 4 : Donut urgence ───────────────────────────────────────
    this.urgencyChart = new Chart(this.urgencyChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels:   ['Urgent (>70%)', 'Moyen (40-70%)', 'Normal (<40%)'],
        datasets: [{
          data:            [this.urgencyDistribution.high, this.urgencyDistribution.medium, this.urgencyDistribution.low],
          backgroundColor: ['#A32D2D','#FF8C00','#3B6D11'],
          borderWidth:     0,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  refreshData(): void { this.loadData(); }
  
  // ⭐ CORRIGÉ : Ajout de /assureur
  goToClaims(): void { 
    this.router.navigate(['/assureur/claims']); 
  }
  
  // ⭐ CORRIGÉ : Ajout de /assureur
  filterByStatus(status: string): void {
    this.router.navigate(['/assureur/claims'], { queryParams: { status } });
  }
}