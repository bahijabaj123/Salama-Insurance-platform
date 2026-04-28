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
};

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule],
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
    if (!g || typeof g.growthRate !== 'number' || Number.isNaN(g.growthRate)) {
      return 'neutral';
    }
    if (g.growthRate > 0) return 'up';
    if (g.growthRate < 0) return 'down';
    return 'neutral';
  });

  readonly chartBars = computed<GrowthBar[]>(() => {
    const g = this.userGrowth();
    if (!g || !Array.isArray(g.series) || g.series.length === 0) return [];
    const max = g.series.reduce((acc, p) => Math.max(acc, p?.count ?? 0), 0);
    return g.series.map((p) => {
      const count = p?.count ?? 0;
      const heightPct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
      return {
        period: p?.period ?? '',
        label: this.formatPeriodShort(p?.period),
        count,
        heightPct
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
      if (doneCount >= 5) {
        this.loading.set(false);
      }
    };

    this.api
      .getUserSummary()
      .pipe(finalize(done))
      .subscribe({
        next: (s) => this.summary.set(s),
        error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load admin summary.')
      });

    this.api
      .getUsersByRole()
      .pipe(finalize(done))
      .subscribe({
        next: (res) => this.roleChart.set(this.normalizeChart('Users by role', res)),
        error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load role distribution.')
      });

    this.api
      .getUsersByApprovalStatus()
      .pipe(finalize(done))
      .subscribe({
        next: (res) => this.approvalChart.set(this.normalizeChart('Users by approval status', res)),
        error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load approval distribution.')
      });

    this.api
      .getUsers({ page: 0, size: 8, sort: 'createdAt,desc' })
      .pipe(finalize(done))
      .subscribe({
        next: (res) => {
          const content = Array.isArray(res) ? res : res.content;
          this.recentUsers.set(content ?? []);
        },
        error: (e: unknown) => this.setErrorFromHttp(e, 'Unable to load recent users.')
      });

    this.api
      .getUsers({ page: 0, size: 5, sort: 'updatedAt,desc', locked: true })
      .pipe(finalize(done))
      .subscribe({
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

    this.api
      .getUsersGrowth(6)
      .pipe(finalize(finishOne))
      .subscribe({
        next: (g) => this.userGrowth.set(g),
        error: (e: unknown) => this.setBusinessErrorFromHttp(e, 'Unable to load user growth analytics.')
      });

    this.api
      .getAccountRates()
      .pipe(finalize(finishOne))
      .subscribe({
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

  private setBusinessErrorFromHttp(err: unknown, fallback: string): void {
    if (this.businessError()) return;

    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      this.businessError.set('Your session has expired. Please sign in again.');
      return;
    }

    if (!(err instanceof HttpErrorResponse)) {
      this.businessError.set(fallback);
      return;
    }

    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      this.businessError.set(body.message);
      return;
    }

    this.businessError.set(fallback);
  }

  donutBackground(points: AdminMetricPoint[]): string {
    const filtered = points.filter((p) => p.value > 0);
    const total = filtered.reduce((acc, p) => acc + p.value, 0);
    if (!total) {
      return 'conic-gradient(#f4f1fa 0deg 360deg)';
    }

    // Soft pastel palette for a charming admin dashboard.
    const colors = [
      '#A0C4FF', // powder blue
      '#FFADAD', // soft coral
      '#CAFFBF', // pastel mint
      '#FFD6A5', // pastel peach
      '#BDB2FF', // periwinkle
      '#FFC6FF', // pastel pink
      '#9BF6FF'  // pastel sky
    ];
    let current = 0;
    const stops: string[] = [];
    filtered.forEach((p, idx) => {
      const delta = (p.value / total) * 360;
      const start = current;
      const end = current + delta;
      current = end;
      const color = colors[idx % colors.length];
      stops.push(`${color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
    });
    if (current < 360) {
      stops.push(`#f4f1fa ${current.toFixed(2)}deg 360deg`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  }

  private normalizeChart(title: string, res: unknown): ChartModel {
    let points: AdminMetricPoint[] = [];

    if (Array.isArray(res)) {
      points = res
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((row) => {
          const label = typeof row['label'] === 'string' ? row['label'] : String(row['label'] ?? '');
          const value =
            typeof row['value'] === 'number'
              ? row['value']
              : typeof row['count'] === 'number'
                ? row['count']
                : 0;
          return { label, value };
        });
    } else if (res && typeof res === 'object') {
      const anyRes = res as { points?: AdminMetricPoint[] };
      if (Array.isArray(anyRes.points)) {
        points = anyRes.points;
      } else {
        const record = res as Record<string, unknown>;
        points = Object.entries(record)
          .filter(([, v]) => typeof v === 'number')
          .map(([k, v]) => ({ label: k, value: v as number }));
      }
    }

    const total = points.reduce((acc, p) => acc + (p.value ?? 0), 0);
    return { title, total, points };
  }

  private setErrorFromHttp(err: unknown, fallback: string): void {
    // Keep first error only; dashboard should still render partial data.
    if (this.error()) return;

    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      // Let guard handle /login redirection on next navigation; avoid hard redirects here.
      this.error.set('Your session has expired. Please sign in again.');
      return;
    }

    if (!(err instanceof HttpErrorResponse)) {
      this.error.set(fallback);
      return;
    }

    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      this.error.set(body.message);
      return;
    }

    this.error.set(fallback);
  }
}

