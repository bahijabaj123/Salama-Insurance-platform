import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { filter, takeUntil } from 'rxjs/operators';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { Claim, ClaimStatus, STATUS_LABELS, STATUS_BADGE_CSS } from '../../../core/models/claim.model';
import { FilterHasExpertPipe } from '../../../core/pipes/filter-has-expert.pipe';
import { ClientExpertMessagesComponent } from '../client-expert-messages/client-expert-messages.component';
import { Subject } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-client-dashboard-home',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FilterHasExpertPipe,
    ClientExpertMessagesComponent,
  ],
  templateUrl: './client-dashboard-home.component.html',
  styleUrls: ['./client-dashboard.component.scss']
})
export class ClientDashboardHomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dashboardDetails') dashboardDetailsRef!: ElementRef<HTMLElement>;
  
  loading = true;
  error = '';
  allClaims: Claim[] = [];
  private chart: any;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private claimService: ClaimService,
    private authStorage: AuthStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (!this.loading) {
          this.queueScrollToFragment();
        }
      });
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  get avgClosedDurationDays(): number | null {
    const durs = this.closedClaims
      .filter(c => c.openingDate && c.closingDate)
      .map(c => this.daysBetween(c.openingDate, c.closingDate!));
    if (!durs.length) return null;
    return Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
  }

  get avgOpenAgeDays(): number | null {
    const open = this.activeClaims.filter(c => c.openingDate);
    if (!open.length) return null;
    const today = new Date().toISOString().slice(0, 10);
    const durs = open.map(c => this.daysBetween(c.openingDate, today));
    return Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
  }

  private daysBetween(startIso: string, endIso: string): number {
    const t0 = new Date(startIso).getTime();
    const t1 = new Date(endIso).getTime();
    if (Number.isNaN(t0) || Number.isNaN(t1)) return 0;
    return Math.max(0, Math.round((t1 - t0) / 86400000));
  }

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

        this.loading = false;
        setTimeout(() => this.initChart(), 100);
        this.queueScrollToFragment();
      },
      error: (err) => {
        console.error('❌ HOME - Erreur:', err);
        this.error = 'Erreur de chargement';
        this.loading = false;
        this.queueScrollToFragment();
      }
    });
  }

  private queueScrollToFragment(): void {
    const f = this.router.parseUrl(this.router.url).fragment;
    if (f !== 'expert-comm' && f !== 'follow-dash') return;
    setTimeout(() => {
      document.getElementById(f)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 220);
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

  scrollToDashboardDetails(): void {
    this.dashboardDetailsRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  trackById(_: number, claim: Claim): number {
    return claim.id;
  }
}
