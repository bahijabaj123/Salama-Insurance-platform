import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, inject, computed } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClaimService } from '../../../core/services/claim.service';
import {
  Claim,
  ClaimStatus,
  STATUS_LABELS,
  expertFullName,
} from '../../../core/models/claim.model';
import { FilterHasExpertPipe } from '../../../core/pipes/filter-has-expert.pipe';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
Chart.register(...registerables);

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  active?: boolean;
}

interface KpiCard {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgClass, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FilterHasExpertPipe
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss'],
})
export class ClientDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private authStorage = inject(AuthStorageService);
  
  @ViewChild('trendChart') trendChartRef!: ElementRef;
  private trendChart!: Chart;

  // ── Data ──────────────────────────────────────────────────────────────────
  allClaims: Claim[] = [];
  activeClaims: Claim[] = [];
  closedClaims: Claim[] = [];
  latestClaim?: Claim;
  kpis: KpiCard[] = [];

  // ── Loading ───────────────────────────────────────────────────────────────
  loading = true;
  error = '';

  // ── Connected client (from AuthStorageService) ──────────────────────────
  currentUser = computed(() => this.authStorage.getUser());
  currentUserId = computed(() => this.currentUser()?.id);
  currentUserEmail = computed(() => this.currentUser()?.email);

  readonly CLIENT_NAME = computed(() => this.currentUser()?.fullName || 'Client');
  readonly CLIENT_EMAIL = computed(() => this.currentUser()?.email);
  readonly CLIENT_REF = 'SA-2024-00847';
  readonly CLIENT_INIT = computed(() => {
    const name = this.currentUser()?.fullName || 'Client';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  // ── Navigation ────────────────────────────────────────────────────────────
  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/client', active: true },
    { icon: 'folder_open', label: 'My claims', route: '/client/sinistres' },
    { icon: 'engineering', label: "Expert consultation", route: '/client/consultation-expert' },
    { icon: 'add_circle', label: 'New report', route: '/client/constat' },
    { icon: 'emergency', label: 'SOS available', route: '/client/sos' },
    { icon: 'description', label: 'My contract', route: '/client/contrat' },
    { icon: 'folder', label: 'Documents', route: '/client/documents' },
    { icon: 'notifications', label: 'Notifications', route: '/client/notifications', badge: 3 },
    { icon: 'smart_toy', label: 'AI Assistant', route: '/client/assistant' },
  ];

  // ── Constants ────────────────────────────────────────────────────────────
  readonly ClaimStatus = ClaimStatus;
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly expertFullName = expertFullName;

  readonly STATUS_BADGE_CSS: Record<ClaimStatus, string> = {
    [ClaimStatus.OPENED]: 'b-opened',
    [ClaimStatus.ASSIGNED_TO_EXPERT]: 'b-assigned',
    [ClaimStatus.UNDER_EXPERTISE]: 'b-expertise',
    [ClaimStatus.CLOSED]: 'b-closed',
    [ClaimStatus.REJECTED]: 'b-rejected',
  };

  readonly TIMELINE_STEPS = [
    { key: 'declared', label: 'Report declared', icon: 'check' },
    { key: 'opened', label: 'Claim opened', icon: 'check' },
    { key: 'assigned', label: 'Expert assigned', icon: 'person' },
    { key: 'expertise', label: "Expertise report", icon: 'search' },
    { key: 'closed', label: 'Compensation', icon: 'paid' },
  ];

  constructor(
    private claimService: ClaimService,
    private router: Router,
  ) { }

  ngOnInit(): void { 
    this.loadData(); 
  }
  
  ngAfterViewInit(): void {
    // Chart will be initialized after data loads
  }
  
  ngOnDestroy(): void { 
    if (this.trendChart) {
      this.trendChart.destroy();
    }
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }

  // ── Loading ────────────────────────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    this.error = '';

    const clientEmail = this.CLIENT_EMAIL();
    const clientId = this.currentUser()?.id;
    
    console.log('👤 Connected client - ID:', clientId, 'Email:', clientEmail);

    this.claimService.getAllClaims().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false),
    ).subscribe({
      next: (claims) => {
        let mine: Claim[];
        
        if (clientId) {
          mine = claims.filter(c => (c as any).client?.id === clientId);
        } else if (clientEmail) {
          mine = claims.filter(c => (c as any).client?.email === clientEmail);
        } else {
          console.warn('⚠️ No client connected, showing all claims');
          mine = claims;
        }

        console.log(`📊 ${mine.length} claim(s) found for the client`);

        this.allClaims = mine;
        this.activeClaims = mine.filter(c =>
          c.status !== ClaimStatus.CLOSED && c.status !== ClaimStatus.REJECTED
        );
        this.closedClaims = mine.filter(c => c.status === ClaimStatus.CLOSED);

        this.latestClaim = [...mine]
          .sort((a, b) => new Date(b.openingDate).getTime() - new Date(a.openingDate).getTime())[0];

        this.buildKpis(mine);
        setTimeout(() => this.initChart(), 200);
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = err.status === 0 ? 'Backend unreachable (port 8082)' : `Error ${err.status}`;
      },
    });
  }

  private buildKpis(claims: Claim[]): void {
    const closed = claims.filter(c => c.status === ClaimStatus.CLOSED).length;
    const active = claims.filter(c =>
      c.status !== ClaimStatus.CLOSED && c.status !== ClaimStatus.REJECTED
    ).length;
    const withExpert = claims.filter(c => c.expert).length;

    this.kpis = [
      { label: 'Total claims', value: claims.length, sub: `${closed} closed`, color: '#185FA5' },
      { label: 'In progress', value: active, sub: 'active files', color: '#FF8C00' },
      { label: 'Expert assigned', value: withExpert, sub: 'tracked files', color: '#0F6E56' },
    ];
  }

  // ── Chart ─────────────────────────────────────────────────────────────

  private initChart(): void {
    if (!this.trendChartRef?.nativeElement) return;
    
    const monthMap = new Map<string, number>();
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthMap.set(monthKey, 0);
    }
    
    this.allClaims.forEach(claim => {
      const date = new Date(claim.openingDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthMap.has(monthKey)) {
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
      }
    });
    
    const labels = Array.from(monthMap.keys());
    const data = Array.from(monthMap.values());
    
    this.trendChart = new Chart(this.trendChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Claims',
          data: data,
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
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `${ctx.raw} claim(s)` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // ── Timeline helpers ──────────────────────────────────────────────────────

  getTimelineStepState(claim: Claim, stepKey: string): 'done' | 'active' | 'pending' {
    const order = ['declared', 'opened', 'assigned', 'expertise', 'closed'];
    const statusToStep: Record<ClaimStatus, string> = {
      [ClaimStatus.OPENED]: 'opened',
      [ClaimStatus.ASSIGNED_TO_EXPERT]: 'assigned',
      [ClaimStatus.UNDER_EXPERTISE]: 'expertise',
      [ClaimStatus.CLOSED]: 'closed',
      [ClaimStatus.REJECTED]: 'closed',
    };

    const currentStep = statusToStep[claim.status] ?? 'opened';
    const currentIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(stepKey);

    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return 'pending';
  }

  getTimelineDate(claim: Claim, stepKey: string): string {
    if (stepKey === 'declared' || stepKey === 'opened') {
      return new Date(claim.openingDate).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    if (stepKey === 'assigned' && claim.assignedDate) {
      return new Date(claim.assignedDate).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short'
      });
    }
    return '';
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goToClaim(id: number): void { 
    this.router.navigate(['/client/sinistres', id]); 
  }
  
  goToList(): void { 
    this.router.navigate(['/client/sinistres']); 
  }
  
  openAssistant(): void { 
    this.router.navigate(['/client/assistant']); 
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  expertName(claim: Claim): string {
    return claim.expert ? `${claim.expert.firstName} ${claim.expert.lastName}` : '';
  }

  expertInitials(claim: Claim): string {
    if (!claim.expert) return '?';
    return `${claim.expert.firstName[0]}${claim.expert.lastName[0]}`.toUpperCase();
  }

  getUrgencyClass(score: number | undefined): string {
    const s = score ?? 0;
    return s > 70 ? 'u-high' : s > 40 ? 'u-mid' : 'u-low';
  }

  trackById(_: number, claim: Claim): number { 
    return claim.id; 
  }

  goToNotifications(): void {
    this.router.navigate(['/client/notifications']);
  }
}