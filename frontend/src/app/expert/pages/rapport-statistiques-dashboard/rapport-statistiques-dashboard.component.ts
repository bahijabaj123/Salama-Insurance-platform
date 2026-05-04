import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

import { ExpertiseReport } from '../../models/expertise-report.model';
import { RapportExpertiseChatService } from '../../services/rapport-expertise-chat.service';

@Component({
  selector: 'app-rapport-statistiques-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rapport-statistiques-dashboard.component.html',
  styleUrl: './rapport-statistiques-dashboard.component.scss'
})
export class RapportStatistiquesDashboardComponent implements OnInit, OnDestroy {
  loading = signal(true);
  refreshing = signal(false);
  error = signal('');
  warning = signal('');
  raw = signal<Record<string, unknown> | null>(null);
  autoRefresh = signal(true);
  refreshEverySec = signal(20);
  nextRefreshInSec = signal(20);
  lastUpdatedAt = signal<string>('');
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;
  reports = signal<ExpertiseReport[]>([]);
  /** List + dashboard can be heavy (many reports); avoid false timeouts. */
  private readonly httpTimeoutMs = 45000;

  titre = computed(() => (this.raw()?.['titre'] as string) ?? 'Statistics');
  date = computed(() => (this.raw()?.['date'] as string) ?? '');
  cards = computed(() => (this.raw()?.['cards'] as Record<string, unknown>[]) ?? []);
  gauges = computed(() => (this.raw()?.['gauges'] as Record<string, unknown>[]) ?? []);
  scorecards = computed(() => (this.raw()?.['scorecards'] as Record<string, unknown>[]) ?? []);
  financialCards = computed(() => {
    const data = this.reports();
    const totalReports = data.length;
    const totalBrut = data.reduce((sum, r) => sum + this.toNumber(r.totalGeneral), 0);
    const totalNet = data.reduce((sum, r) => sum + this.toNumber(r.totalNet), 0);
    const totalIndemnity = data.reduce((sum, r) => sum + this.toNumber(r.estimatedIndemnity), 0);
    const averageTicket = totalReports > 0 ? totalNet / totalReports : 0;

    return [
      { label: 'Estimated gross total', value: this.currency(totalBrut), hint: 'Sum of general totals', tone: 'indigo' as const },
      { label: 'Estimated net total', value: this.currency(totalNet), hint: 'After discounts / depreciation', tone: 'sky' as const },
      { label: 'Estimated indemnity', value: this.currency(totalIndemnity), hint: 'Global projection', tone: 'emerald' as const },
      { label: 'Average net ticket', value: this.currency(averageTicket), hint: `${totalReports} report(s)`, tone: 'amber' as const }
    ];
  });
  realtimeCards = computed(() => {
    const data = this.reports();
    const now = Date.now();
    const inProgress = data.filter((r) => this.normStatus(r.statutRapport || r.expertiseStatus).includes('EN_COURS')).length;
    const validated = data.filter((r) => this.normStatus(r.statutRapport || r.expertiseStatus).includes('VALIDE')).length;
    const lastHour = data.filter((r) => {
      const t = this.reportDateMs(r);
      return t > 0 && now - t <= 60 * 60 * 1000;
    }).length;
    const last24h = data.filter((r) => {
      const t = this.reportDateMs(r);
      return t > 0 && now - t <= 24 * 60 * 60 * 1000;
    }).length;
    return [
      { label: 'Reports in progress', value: inProgress },
      { label: 'Validated reports', value: validated },
      { label: 'Activity (1h)', value: `${lastHour} upd` },
      { label: 'Activity (24h)', value: `${last24h} upd` }
    ];
  });
  recentTimeline = computed(() =>
    [...this.reports()]
      .sort((a, b) => this.reportDateMs(b) - this.reportDateMs(a))
      .slice(0, 8)
  );
  montantParJour = computed(() => {
    const grouped = new Map<string, { amount: number; firstMs: number }>();
    for (const r of this.reports()) {
      const ms = this.reportDateMs(r);
      if (!ms) continue;
      const day = new Date(ms).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
      const add = this.toNumber(r.totalNet || r.totalGeneral);
      const prev = grouped.get(day);
      if (prev) {
        grouped.set(day, { amount: prev.amount + add, firstMs: Math.min(prev.firstMs, ms) });
      } else {
        grouped.set(day, { amount: add, firstMs: ms });
      }
    }
    return Array.from(grouped.entries())
      .map(([day, { amount, firstMs }]) => ({ day, amount, sortMs: firstMs }))
      .sort((a, b) => a.sortMs - b.sortMs)
      .slice(-10)
      .map(({ day, amount }) => ({ day, amount }));
  });
  montantParJourMax = computed(() => {
    const vals = this.montantParJour().map((x) => x.amount);
    return vals.length ? Math.max(...vals, 1) : 1;
  });
  /** Short “smart” summary for the bar window (chronological order). */
  netWindowInsight = computed(() => {
    const series = this.montantParJour();
    if (!series.length) return null;
    const peak = series.reduce((best, p) => (p.amount > best.amount ? p : best));
    const zeroDays = series.filter((p) => p.amount === 0).length;
    const totalWindow = series.reduce((s, p) => s + p.amount, 0);
    let trend: string | null = null;
    if (series.length >= 4) {
      const mid = Math.floor(series.length / 2);
      const first = series.slice(0, mid).reduce((s, p) => s + p.amount, 0);
      const second = series.slice(mid).reduce((s, p) => s + p.amount, 0);
      if (second > first * 1.05) trend = 'The second half of the displayed period concentrates more net volume.';
      else if (first > 0 && second < first * 0.95) trend = 'Net volume tapers toward the end of the displayed period.';
      else trend = 'Net volume is relatively balanced across the window.';
    }
    return { peak, zeroDays, totalWindow, trend };
  });
  statutsPie = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.reports()) {
      const key = this.normStatus(r.statutRapport || r.expertiseStatus) || 'UNKNOWN';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const palette = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#64748b'];
    return Array.from(counts.entries()).map(([label, value], idx) => ({
      label,
      value,
      color: palette[idx % palette.length]
    }));
  });
  pieReportsTotal = computed(() => this.statutsPie().reduce((s, d) => s + d.value, 0));
  pipelineInsight = computed(() => {
    const data = this.reports();
    const n = data.length;
    if (!n) return null;
    const valides = data.filter((r) => this.normStatus(r.statutRapport || r.expertiseStatus).includes('VALIDE')).length;
    const enCours = data.filter((r) => this.normStatus(r.statutRapport || r.expertiseStatus).includes('EN_COURS')).length;
    const pctValides = Math.round((valides / n) * 100);
    return { total: n, valides, enCours, pctValides };
  });
  pieConic = computed(() => {
    const data = this.statutsPie();
    const total = data.reduce((s, d) => s + d.value, 0);
    if (!total) return 'conic-gradient(#e2e8f0 0 100%)';
    let cursor = 0;
    const slices = data.map((d) => {
      const start = (cursor / total) * 100;
      cursor += d.value;
      const end = (cursor / total) * 100;
      return `${d.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${slices.join(', ')})`;
  });
  chartEntries = computed(() => {
    const charts = this.raw()?.['charts'];
    if (!charts || typeof charts !== 'object' || Array.isArray(charts)) return [];
    return Object.entries(charts as Record<string, unknown>).map(([key, chart]) => ({
      key,
      chart: chart as Record<string, unknown>
    }));
  });

  constructor(private rapportService: RapportExpertiseChatService) {}

  ngOnInit(): void {
    this.loadReportsForRisk(true);
    this.startLiveRefresh();
  }

  ngOnDestroy(): void {
    this.stopLiveRefresh();
  }

  refreshNow(): void {
    this.loadReportsForRisk(false);
    this.nextRefreshInSec.set(this.refreshEverySec());
  }

  toggleLiveMode(): void {
    this.autoRefresh.update((v) => !v);
    if (this.autoRefresh()) this.startLiveRefresh();
    else this.stopLiveRefresh();
  }

  private loadReportsForRisk(isInitialLoad: boolean): void {
    if (isInitialLoad) this.loading.set(true);
    else this.refreshing.set(true);
    this.error.set('');
    this.warning.set('');
    forkJoin({
      reports: this.rapportService.getAllReports().pipe(
        timeout(this.httpTimeoutMs),
        catchError(() => {
          this.warning.set('Could not load reports from the database (timeout or error). Showing fallback view.');
          return of([] as ExpertiseReport[]);
        }),
      ),
      dashboard: this.rapportService.getExpertDashboardComplet().pipe(
        timeout(this.httpTimeoutMs),
        catchError(() => {
          this.warning.update((w) =>
            w
              ? `${w} Dashboard API unavailable or too slow: using locally computed statistics.`
              : 'Dashboard API unavailable or too slow: using locally computed statistics.',
          );
          return of(null as Record<string, unknown> | null);
        }),
      ),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
          this.lastUpdatedAt.set(new Date().toLocaleTimeString('en-US'));
        }),
      )
      .subscribe({
        next: ({ reports, dashboard }) => {
          this.reports.set(Array.isArray(reports) ? reports : []);
          if (dashboard == null) {
            this.raw.set(this.buildFallbackDashboard());
          } else {
            this.raw.set(dashboard);
          }
        },
        error: () => {
          this.reports.set([]);
          this.raw.set(this.buildFallbackDashboard());
        },
      });
  }

  private startLiveRefresh(): void {
    this.stopLiveRefresh();
    if (!this.autoRefresh()) return;
    this.refreshTimerId = setInterval(() => {
      if (this.autoRefresh()) {
        this.loadReportsForRisk(false);
        this.nextRefreshInSec.set(this.refreshEverySec());
      }
    }, this.refreshEverySec() * 1000);

    this.countdownTimerId = setInterval(() => {
      if (!this.autoRefresh()) return;
      this.nextRefreshInSec.update((v) => (v <= 1 ? this.refreshEverySec() : v - 1));
    }, 1000);
  }

  private stopLiveRefresh(): void {
    if (this.refreshTimerId) clearInterval(this.refreshTimerId);
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    this.refreshTimerId = null;
    this.countdownTimerId = null;
  }

  fmt(v: unknown): string {
    if (v == null) return '—';
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return String(v);
  }

  barPercent(value: unknown, max: unknown): number {
    const v = typeof value === 'number' ? value : parseFloat(String(value));
    const m = typeof max === 'number' && max > 0 ? max : 100;
    if (!Number.isFinite(v) || m <= 0) return 0;
    return Math.min(100, Math.max(0, (v / m) * 100));
  }

  pieSlicePercent(count: number): number {
    const t = this.pieReportsTotal();
    if (!t || count <= 0) return 0;
    return Math.round((count / t) * 100);
  }

  isZeroAmount(amount: number): boolean {
    return !amount || amount <= 0;
  }

  isBarEmpty(value: unknown): boolean {
    if (value == null) return true;
    const n = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    return !Number.isFinite(n) || n <= 0;
  }

  expertStatutTone(statut: unknown): 'active' | 'inactive' | 'muted' {
    const s = this.normStatus(statut);
    if (!s || s === '—') return 'muted';
    if (s.includes('INACT')) return 'inactive';
    if (s.includes('ACT')) return 'active';
    return 'muted';
  }

  chartData(chart: Record<string, unknown>): Record<string, unknown>[] {
    const d = chart['data'];
    return Array.isArray(d) ? (d as Record<string, unknown>[]) : [];
  }

  chartMax(data: Record<string, unknown>[]): number {
    let max = 0;
    for (const row of data) {
      const n = parseFloat(String(row['value']).replace(',', '.'));
      if (Number.isFinite(n)) max = Math.max(max, n);
    }
    return max > 0 ? max : 1;
  }

  chartRowValue(row: Record<string, unknown>): number {
    return this.toNumber(row['value']);
  }

  /** Watermark per card (quick read of series type). FR + EN API titles. */
  chartCardBackdrop(chart: Record<string, unknown>, key: string): string {
    const t = String(chart['titre'] ?? '').toLowerCase();
    const k = key.toLowerCase();
    const activeInactive =
      ((t.includes('actif') || t.includes('active')) && (t.includes('inactif') || t.includes('inactive'))) ||
      (k.includes('actif') && k.includes('inactif'));
    if (activeInactive) return 'TEAM';
    if (t.includes('statut') || t.includes('status') || k.includes('statut') || k.includes('status')) return 'STATUSES';
    if (t.includes('zone') || k.includes('zone')) return 'ZONES';
    if (t.includes('montant') || t.includes('amount') || t.includes('(dt)') || k.includes('montant') || k.includes('amount')) return 'NET';
    if ((t.includes('rapport') && t.includes('expert')) || (t.includes('report') && t.includes('expert'))) return 'LOAD';
    return 'DATA';
  }

  /** Short “smart” line under each chart title. FR + EN API titles. */
  chartCardInsight(chart: Record<string, unknown>): string | null {
    const data = this.chartData(chart);
    if (!data.length) return null;
    const max = this.chartMax(data);
    const titre = String(chart['titre'] ?? '').toLowerCase();

    const isActiveInactive =
      ((titre.includes('actif') || titre.includes('active')) &&
        (titre.includes('inactif') || titre.includes('inactive'))) ||
      (titre.includes('expert') && titre.includes('actif') && titre.includes('inactif'));

    if (isActiveInactive) {
      const total = data.reduce((s, r) => s + this.chartRowValue(r), 0);
      if (total <= 0) return 'Breakdown unavailable (headcount is zero).';
      let active = 0;
      for (const r of data) {
        const lab = String(r['label'] ?? '').toUpperCase();
        if (lab.includes('INACT')) continue;
        if (lab.includes('ACT')) active += this.chartRowValue(r);
      }
      const pct = Math.round((active / total) * 100);
      return `${pct}% active experts out of ${total} total — complete inactive profiles for better visibility.`;
    }

    if (max <= 0) {
      return 'Flat series — all values are zero in this view.';
    }

    let top = data[0];
    let topV = this.chartRowValue(top);
    for (const row of data) {
      const v = this.chartRowValue(row);
      if (v > topV) {
        topV = v;
        top = row;
      }
    }
    const label = String(top['label'] ?? '—');
    const val = this.fmt(top['value']);

    if (titre.includes('zone')) return `Leading hub: ${label} (${val} experts).`;
    if (titre.includes('montant') || titre.includes('amount') || titre.includes('net')) return `Highest net volume: ${label} (${val} DT).`;
    if (
      (titre.includes('nombre') || titre.includes('number')) &&
      (titre.includes('rapport') || titre.includes('report'))
    ) {
      return `Highest workload: ${label} (${val} report(s)).`;
    }
    if (titre.includes('statut') || titre.includes('status')) return `Most common status: ${label} (${val}).`;
    return `Highest value: ${label} (${val}).`;
  }

  chartIsDualExpertGauge(chart: Record<string, unknown>): boolean {
    const t = String(chart['titre'] ?? '').toLowerCase();
    const d = this.chartData(chart);
    const activeInactive =
      (t.includes('actif') || t.includes('active')) && (t.includes('inactif') || t.includes('inactive'));
    return d.length === 2 && activeInactive;
  }

  barListRowRank(entry: { chart: Record<string, unknown> }, row: Record<string, unknown>): number | null {
    const data = this.chartData(entry.chart);
    const max = this.chartMax(data);
    if (max <= 0) return null;
    if (this.chartRowValue(row) <= 0) return null;
    const sorted = [...data].filter((r) => this.chartRowValue(r) > 0).sort((a, b) => this.chartRowValue(b) - this.chartRowValue(a));
    const idx = sorted.findIndex((r) => r['label'] === row['label']);
    if (idx < 0 || idx > 2) return null;
    return idx + 1;
  }

  barListShareOfMax(row: Record<string, unknown>, chart: Record<string, unknown>): number | null {
    const data = this.chartData(chart);
    const max = this.chartMax(data);
    if (max <= 0) return null;
    const v = this.chartRowValue(row);
    if (v <= 0) return null;
    return Math.min(100, Math.round((v / max) * 100));
  }

  private toNumber(v: unknown): number {
    if (v == null) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  private currency(v: number): string {
    return `${v.toLocaleString('en-US', { maximumFractionDigits: 2 })} DT`;
  }

  private normStatus(v: unknown): string {
    return String(v ?? '').trim().toUpperCase();
  }

  private reportDateMs(report: ExpertiseReport): number {
    const candidate = report.dateExamen || report.dateMission || report.dateAccident || '';
    const ms = candidate ? new Date(candidate).getTime() : 0;
    return Number.isFinite(ms) ? ms : 0;
  }

  timelineDate(report: ExpertiseReport): string {
    const ms = this.reportDateMs(report);
    if (!ms) return 'Unknown date';
    return new Date(ms).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private buildFallbackDashboard(): Record<string, unknown> {
    const data = this.reports();
    const total = data.length;
    const valides = data.filter((r) => this.normStatus(r.statutRapport || r.expertiseStatus).includes('VALIDE')).length;
    const enCours = data.filter((r) => this.normStatus(r.statutRapport || r.expertiseStatus).includes('EN_COURS')).length;
    const totalNet = data.reduce((s, r) => s + this.toNumber(r.totalNet || r.totalGeneral), 0);
    return {
      titre: 'Dashboard (local fallback)',
      date: new Date().toLocaleDateString('en-US'),
      cards: [
        { id: 'total', label: 'Reports', value: total, unite: '', description: 'Total number of reports' },
        { id: 'validated', label: 'Validated', value: valides, unite: '', description: 'Validated reports' },
        { id: 'encours', label: 'In progress', value: enCours, unite: '', description: 'Reports in progress' },
        { id: 'net', label: 'Net total', value: totalNet, unite: 'DT', description: 'Cumulative net amount' }
      ],
      gauges: [],
      scorecards: [],
      charts: {}
    };
  }

  hasBlockingError(): boolean {
    return !!this.error();
  }
}
