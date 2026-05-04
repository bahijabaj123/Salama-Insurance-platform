import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs/operators';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import type { LoginApiErrorBody } from '../../../core/auth/login.models';
import { AdminApiService } from '../../core/admin-api.service';
import type {
  AccountRatesResponse,
  AdminMetricPoint,
  AdminUserRow,
  AdminUserSummary,
  UserGrowthResponse
} from '../../core/admin.models';

type ChartModel = {
  title: string;
  total: number;
  points: AdminMetricPoint[];
};

type GrowthBar = {
  period: string;
  label: string;
  count: number;
  heightPct: number;
  current: boolean;
};

export type DonutSegment = {
  label: string;
  value: number;
  pct: number;
  color: string;
  /** stroke-dasharray length for the colored slice (in svg user units). */
  dash: number;
  /** stroke-dashoffset (negative = clockwise advance). */
  offset: number;
};

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** Brand palette for the role donut. */
const ROLE_COLORS: Record<string, string> = {
  CLIENT: '#2563eb',     // blue
  EXPERT: '#8b5cf6',     // purple
  ASSUREUR: '#14b8a6',   // teal
  ADMIN: '#0f172a'       // fallback for any admin shown
};

/** Brand palette for the approval donut. */
const APPROVAL_COLORS: Record<string, string> = {
  APPROVED: '#16a34a',   // green
  PENDING: '#f59e0b',    // orange
  REJECTED: '#ef4444'    // red
};

const DEFAULT_PALETTE = ['#0ea5e9','#a855f7','#10b981','#f97316','#ef4444','#22d3ee','#facc15'];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly authStorage = inject(AuthStorageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly summary = signal<AdminUserSummary | null>(null);
  readonly roleChart = signal<ChartModel | null>(null);
  readonly approvalChart = signal<ChartModel | null>(null);

  readonly recentUsers = signal<AdminUserRow[]>([]);
  readonly lockedUsers = signal<AdminUserRow[]>([]);
  readonly pendingPreview = computed(() =>
    (this.recentUsers() ?? []).filter((u) => u.requestedRole && u.approvalStatus === 'PENDING').slice(0, 4)
  );

  readonly userGrowth = signal<UserGrowthResponse | null>(null);
  readonly accountRates = signal<AccountRatesResponse | null>(null);
  readonly businessLoading = signal(true);
  readonly businessError = signal<string | null>(null);

  readonly growthState = computed<'up' | 'down' | 'neutral'>(() => {
    const g = this.userGrowth();
    if (!g || typeof g.growthRate !== 'number' || Number.isNaN(g.growthRate)) return 'neutral';
    if (g.growthRate > 0) return 'up';
    if (g.growthRate < 0) return 'down';
    return 'neutral';
  });

  /** SVG donut geometry. */
  readonly DONUT_R = 56;
  readonly DONUT_C = 2 * Math.PI * 56;
  readonly DONUT_STROKE = 18;

  readonly roleSegments = computed<DonutSegment[]>(() =>
    this.toSegments(this.roleChart()?.points ?? [], ROLE_COLORS)
  );

  readonly approvalSegments = computed<DonutSegment[]>(() =>
    this.toSegments(this.approvalChart()?.points ?? [], APPROVAL_COLORS)
  );

  /** Y-axis max rounded to a "nice" number for the growth chart. */
  readonly chartYMax = computed<number>(() => {
    const g = this.userGrowth();
    const raw = Math.max(0, ...((g?.series ?? []).map((p) => p?.count ?? 0)));
    return this.niceCeil(raw);
  });

  /** Five evenly-spaced ticks from 0 → chartYMax. */
  readonly chartYTicks = computed<number[]>(() => {
    const max = this.chartYMax();
    if (max <= 0) return [0];
    const step = max / 4;
    return [0, 1, 2, 3, 4].map((i) => Math.round(i * step));
  });

  readonly chartBars = computed<GrowthBar[]>(() => {
    const g = this.userGrowth();
    if (!g || !Array.isArray(g.series) || g.series.length === 0) return [];
    const max = this.chartYMax();
    const current = this.currentPeriod();
    return g.series.map((p) => {
      const count = p?.count ?? 0;
      const heightPct = max > 0 ? Math.max(count > 0 ? 4 : 0, Math.round((count / max) * 100)) : 0;
      return {
        period: p?.period ?? '',
        label: this.formatPeriodShort(p?.period),
        count,
        heightPct,
        current: !!p?.period && p.period === current
      };
    });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    let doneCount = 0;
    const done = () => {
      doneCount += 1;
      if (doneCount >= 5) this.loading.set(false);
    };

    this.api.getUserSummary().pipe(finalize(done)).subscribe({
      next: (s) => this.summary.set(s),
      error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load admin summary.')
    });

    this.api.getUsersByRole().pipe(finalize(done)).subscribe({
      next: (res) => this.roleChart.set(this.normalizeChart('Users by role', res)),
      error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load role distribution.')
    });

    this.api.getUsersByApprovalStatus().pipe(finalize(done)).subscribe({
      next: (res) => this.approvalChart.set(this.normalizeChart('Users by approval status', res)),
      error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load approval distribution.')
    });

    this.api.getUsers({ page: 0, size: 8, sort: 'createdAt,desc' }).pipe(finalize(done)).subscribe({
      next: (res) => {
        const content = Array.isArray(res) ? res : res.content;
        this.recentUsers.set(content ?? []);
      },
      error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load recent users.')
    });

    this.api.getUsers({ page: 0, size: 5, sort: 'updatedAt,desc', locked: true }).pipe(finalize(done)).subscribe({
      next: (res) => {
        const content = Array.isArray(res) ? res : res.content;
        this.lockedUsers.set(content ?? []);
      },
      error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load locked users.')
    });

    this.loadBusinessInsights();
  }

  private loadBusinessInsights(): void {
    this.businessLoading.set(true);
    this.businessError.set(null);

    let pending = 2;
    const finishOne = () => {
      pending -= 1;
      if (pending <= 0) this.businessLoading.set(false);
    };

    this.api.getUsersGrowth(6).pipe(finalize(finishOne)).subscribe({
      next: (g) => this.userGrowth.set(g),
      error: (e: unknown) => this.setBusinessErrorFromHttp(e, 'Unable to load user growth analytics.')
    });

    this.api.getAccountRates().pipe(finalize(finishOne)).subscribe({
      next: (r) => this.accountRates.set(r),
      error: (e: unknown) => this.setBusinessErrorFromHttp(e, 'Unable to load account rates.')
    });
  }

  formatPeriod(period: string | null | undefined): string {
    if (!period) return '—';
    const [year, month] = period.split('-');
    const m = Number(month);
    const y = Number(year);
    if (!y || !m || m < 1 || m > 12) return period;
    return `${MONTH_LONG[m - 1]} ${y}`;
  }

  formatPeriodShort(period: string | null | undefined): string {
    if (!period) return '—';
    const [, month] = period.split('-');
    const m = Number(month);
    if (!m || m < 1 || m > 12) return period;
    return MONTH_SHORT[m - 1];
  }

  formatPercent(value: number | null | undefined, withSign = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const sign = withSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  clampPercent(value: number | null | undefined): number {
    if (value === null || value === undefined || Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }

  /** Current YYYY-MM period (used to highlight the bar of the current month). */
  currentPeriod(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /** Round n up to a "nice" axis maximum (1, 2, 5, 10, 20, 50, 100, ...). */
  private niceCeil(n: number): number {
    if (!isFinite(n) || n <= 0) return 4;
    const exp = Math.floor(Math.log10(n));
    const pow = Math.pow(10, exp);
    const f = n / pow;
    let nice: number;
    if (f <= 1) nice = 1;
    else if (f <= 2) nice = 2;
    else if (f <= 5) nice = 5;
    else nice = 10;
    return nice * pow;
  }

  /** Compute SVG-ready donut segments from raw points using the given color map. */
  private toSegments(
    points: AdminMetricPoint[],
    palette: Record<string, string>
  ): DonutSegment[] {
    const C = this.DONUT_C;
    const filtered = (points ?? []).filter((p) => p && p.value > 0);
    const total = filtered.reduce((acc, p) => acc + p.value, 0);
    if (!total) return [];

    let cumulative = 0;
    return filtered.map((p, idx) => {
      const fraction = p.value / total;
      const dash = fraction * C;
      const offset = -cumulative;
      cumulative += dash;
      const key = (p.label ?? '').toUpperCase();
      const color = palette[key] ?? DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
      return {
        label: p.label,
        value: p.value,
        pct: fraction * 100,
        color,
        dash,
        offset
      };
    });
  }

  private normalizeChart(title: string, res: unknown): ChartModel {
    let points: AdminMetricPoint[] = [];
    if (Array.isArray(res)) {
      points = res
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((row) => {
          const label = typeof row['label'] === 'string' ? row['label'] : String(row['label'] ?? '');
          const value = typeof row['value'] === 'number' ? row['value'] : typeof row['count'] === 'number' ? row['count'] : 0;
          return { label, value };
        });
    } else if (res && typeof res === 'object') {
      const anyRes = res as { points?: AdminMetricPoint[] };
      if (Array.isArray(anyRes.points)) {
        points = anyRes.points;
      } else {
        points = Object.entries(res as Record<string, unknown>)
          .filter(([, v]) => typeof v === 'number')
          .map(([k, v]) => ({ label: k, value: v as number }));
      }
    }
    const total = points.reduce((acc, p) => acc + (p.value ?? 0), 0);
    return { title, total, points };
  }

  private setErrorFromHttp(err: unknown, fallback: string): void {
    if (this.error()) return;
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      this.error.set('Your session has expired. Please sign in again.');
      return;
    }
    if (!(err instanceof HttpErrorResponse)) { this.error.set(fallback); return; }
    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      this.error.set(body.message); return;
    }
    this.error.set(fallback);
  }

  private setBusinessErrorFromHttp(err: unknown, fallback: string): void {
    if (this.businessError()) return;
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      this.businessError.set('Your session has expired. Please sign in again.');
      return;
    }
    if (!(err instanceof HttpErrorResponse)) { this.businessError.set(fallback); return; }
    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      this.businessError.set(body.message); return;
    }
    this.businessError.set(fallback);
  }
}
