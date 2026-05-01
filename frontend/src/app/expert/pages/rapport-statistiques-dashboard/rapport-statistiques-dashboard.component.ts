import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, finalize, switchMap, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

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
  private readonly httpTimeoutMs = 15000;

  titre = computed(() => (this.raw()?.['titre'] as string) ?? 'Statistiques');
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
      { label: 'Total brut estime', value: this.currency(totalBrut), hint: 'Somme des totaux generaux' },
      { label: 'Total net estime', value: this.currency(totalNet), hint: 'Apres remises / vetuste' },
      { label: 'Indemnisation estimee', value: this.currency(totalIndemnity), hint: 'Projection globale' },
      { label: 'Ticket moyen net', value: this.currency(averageTicket), hint: `${totalReports} rapport(s)` }
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
      { label: 'Rapports en cours', value: inProgress },
      { label: 'Rapports valides', value: validated },
      { label: 'Activite (1h)', value: `${lastHour} maj` },
      { label: 'Activite (24h)', value: `${last24h} maj` }
    ];
  });
  recentTimeline = computed(() =>
    [...this.reports()]
      .sort((a, b) => this.reportDateMs(b) - this.reportDateMs(a))
      .slice(0, 8)
  );
  montantParJour = computed(() => {
    const grouped = new Map<string, number>();
    for (const r of this.reports()) {
      const ms = this.reportDateMs(r);
      if (!ms) continue;
      const day = new Date(ms).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      grouped.set(day, (grouped.get(day) ?? 0) + this.toNumber(r.totalNet || r.totalGeneral));
    }
    return Array.from(grouped.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => {
        const [ad, am] = a.day.split('/').map(Number);
        const [bd, bm] = b.day.split('/').map(Number);
        return am === bm ? ad - bd : am - bm;
      })
      .slice(-10);
  });
  montantParJourMax = computed(() => {
    const vals = this.montantParJour().map((x) => x.amount);
    return vals.length ? Math.max(...vals, 1) : 1;
  });
  statutsPie = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.reports()) {
      const key = this.normStatus(r.statutRapport || r.expertiseStatus) || 'INCONNU';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const palette = ['#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#64748b'];
    return Array.from(counts.entries()).map(([label, value], idx) => ({
      label,
      value,
      color: palette[idx % palette.length]
    }));
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
    this.rapportService
      .getAllReports()
      .pipe(
        timeout(this.httpTimeoutMs),
        catchError(() => {
          this.reports.set([]);
          this.warning.set('Impossible de charger les rapports depuis la base (timeout ou erreur). Affichage fallback.');
          return of([] as ExpertiseReport[]);
        }),
        switchMap((reports) => {
          this.reports.set(Array.isArray(reports) ? reports : []);
          return this.rapportService.getExpertDashboardComplet().pipe(
            timeout(this.httpTimeoutMs),
            catchError(() => {
              this.warning.set(
                (this.warning() ? this.warning() + ' ' : '') +
                  'Dashboard API indisponible ou trop lent: utilisation des stats calculees localement.',
              );
              return of(this.buildFallbackDashboard());
            }),
          );
        }),
        finalize(() => {
          this.loading.set(false);
          this.refreshing.set(false);
          this.lastUpdatedAt.set(new Date().toLocaleTimeString('fr-FR'));
        }),
      )
      .subscribe({
        next: (dashboard) => {
          this.raw.set(dashboard as Record<string, unknown>);
        },
        error: () => {
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
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    return String(v);
  }

  barPercent(value: unknown, max: unknown): number {
    const v = typeof value === 'number' ? value : parseFloat(String(value));
    const m = typeof max === 'number' && max > 0 ? max : 100;
    if (!Number.isFinite(v) || m <= 0) return 0;
    return Math.min(100, Math.max(0, (v / m) * 100));
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

  private toNumber(v: unknown): number {
    if (v == null) return 0;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }

  private currency(v: number): string {
    return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DT`;
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
    if (!ms) return 'Date inconnue';
    return new Date(ms).toLocaleString('fr-FR', {
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
      titre: 'Tableau de bord (fallback local)',
      date: new Date().toLocaleDateString('fr-FR'),
      cards: [
        { id: 'total', label: 'Rapports', value: total, unite: '', description: 'Nombre total de rapports' },
        { id: 'validated', label: 'Valides', value: valides, unite: '', description: 'Rapports valides' },
        { id: 'encours', label: 'En cours', value: enCours, unite: '', description: 'Rapports en cours' },
        { id: 'net', label: 'Total net', value: totalNet, unite: 'DT', description: 'Montant net cumule' }
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
