import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, interval, of } from 'rxjs';
import { mergeMap, takeUntil } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { ClaimService } from '../../../core/services/claim.service';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import {
  Claim,
  ClaimStatus,
  STATUS_BADGE_CSS,
  STATUS_LABELS,
} from '../../../core/models/claim.model';

function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

@Component({
  selector: 'app-client-processing-stats',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './client-processing-stats.component.html',
  styleUrl: './client-processing-stats.component.scss',
})
export class ClientProcessingStatsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private tickTimer?: ReturnType<typeof setInterval>;

  readonly loading = signal(true);
  readonly error = signal('');
  readonly claims = signal<Claim[]>([]);
  /** Drives live elapsed labels for open claims (1s resolution). */
  readonly nowMs = signal(Date.now());
  readonly lastSyncedAt = signal<Date | null>(null);
  /** Claims returned by API (before client filter). */
  readonly serverClaimCount = signal(0);
  /** API returned claims but none matched the logged-in client profile. */
  readonly claimsUnmatched = signal(false);

  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_BADGE_CSS = STATUS_BADGE_CSS;

  /** Stable local reference (days) — persisted, then nudged in real time for display. */
  private baselineClosedDays = 18;
  private baselineOpenDays = 8;

  constructor(
    private readonly claimService: ClaimService,
    private readonly auth: AuthStorageService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initLocalBaseline();
    this.tickTimer = setInterval(() => this.nowMs.set(Date.now()), 1000);
    this.startPolling();
  }

  /** Seeded once per browser profile: illustrative throughput when you have no closed history yet. */
  private initLocalBaseline(): void {
    const u = this.auth.getUser();
    const key = `salama.processingEst.baseline.${(u?.email || u?.id || 'anon').toString()}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const p = JSON.parse(raw) as { closed?: number; open?: number };
        if (typeof p.closed === 'number' && typeof p.open === 'number') {
          this.baselineClosedDays = p.closed;
          this.baselineOpenDays = p.open;
          return;
        }
      } catch {
        /* ignore */
      }
    }
    const seed = hashString(String(u?.email || u?.fullName || u?.id || 'local').toLowerCase());
    this.baselineClosedDays = 14 + (seed % 12);
    this.baselineOpenDays = 4 + (seed % 10);
    localStorage.setItem(key, JSON.stringify({ closed: this.baselineClosedDays, open: this.baselineOpenDays }));
  }

  ngOnDestroy(): void {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(): void {
    of(null)
      .pipe(
        mergeMap(() => this.claimService.getAllClaims()),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (rows) => this.applyClaims(rows),
        error: () => {
          this.error.set('Could not load your claims.');
          this.loading.set(false);
        },
      });

    interval(45_000)
      .pipe(
        mergeMap(() => this.claimService.getAllClaims()),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (rows) => this.applyClaims(rows),
        error: () => {},
      });
  }

  refresh(): void {
    this.loading.set(true);
    this.claimService.getAllClaims().subscribe({
      next: (rows) => this.applyClaims(rows),
      error: () => {
        this.error.set('Could not load your claims.');
        this.loading.set(false);
      },
    });
  }

  private applyClaims(all: Claim[]): void {
    const user = this.auth.getUser();
    const id = user?.id;
    const email = (user?.email || '').trim().toLowerCase();
    this.serverClaimCount.set(all.length);

    const matchesClient = (c: Claim): boolean => {
      const cl = (c as any).client;
      if (cl == null) return false;
      if (id != null && cl.id != null && Number(cl.id) === Number(id)) return true;
      if (email && cl.email && String(cl.email).trim().toLowerCase() === email) return true;
      return false;
    };

    const list = id != null || email ? all.filter(matchesClient) : [];
    this.claimsUnmatched.set(list.length === 0 && all.length > 0);
    this.claims.set(list);
    this.lastSyncedAt.set(new Date());
    this.error.set('');
    this.loading.set(false);
  }

  goBack(): void {
    void this.router.navigate(['/client/consultation-expert']);
  }

  get activeClaims(): Claim[] {
    return this.claims().filter((c) => c.status !== ClaimStatus.CLOSED && c.status !== ClaimStatus.REJECTED);
  }

  get closedClaims(): Claim[] {
    return this.claims().filter((c) => c.status === ClaimStatus.CLOSED);
  }

  get avgClosedDurationDays(): number | null {
    const durs = this.closedClaims
      .filter((c) => c.openingDate && c.closingDate)
      .map((c) => this.daysBetween(c.openingDate, c.closingDate!));
    if (!durs.length) return null;
    return Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
  }

  /** Horizon (days) for ETA: your closed average, else stored local baseline. */
  targetHorizonDaysForDisplay(): number {
    const a = this.avgClosedDurationDays;
    return a != null ? a : this.baselineClosedDays;
  }

  /**
   * Local, real-time illustrative benchmark (days). Oscillates gently so the UI proves the clock is live.
   * Not a server metric — shown when you have no closed history and in the “local estimate” strip.
   */
  localLiveClosedBenchmark(): string {
    this.nowMs();
    const t = this.nowMs() / 95_000;
    const v = this.baselineClosedDays + Math.sin(t) * 1.35 + Math.sin(t / 2.2) * 0.45;
    return Math.max(6, v).toFixed(1);
  }

  localLiveOpenBenchmark(): string {
    this.nowMs();
    const t = this.nowMs() / 72_000;
    const v = this.baselineOpenDays + Math.cos(t) * 0.9 + Math.sin(t / 1.7) * 0.35;
    return Math.max(2, v).toFixed(1);
  }

  /** Very rough ETA for open claims: horizon minus elapsed (days), updates every second. */
  openRemainingEstimateDays(c: Claim): string | null {
    this.nowMs();
    if (!c.openingDate || this.isTerminal(c)) return null;
    const elapsedDays =
      (this.nowMs() - new Date(c.openingDate).getTime()) / 86_400_000;
    const horizon = this.targetHorizonDaysForDisplay();
    const rem = Math.max(0, horizon - elapsedDays);
    if (rem < 0.05) return '~0 d';
    return `~${rem.toFixed(1)} d`;
  }

  get avgOpenAgeDays(): number | null {
    const open = this.activeClaims.filter((c) => c.openingDate);
    if (!open.length) return null;
    const today = new Date().toISOString().slice(0, 10);
    const durs = open.map((c) => this.daysBetween(c.openingDate, today));
    return Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
  }

  private daysBetween(startIso: string, endIso: string): number {
    const t0 = new Date(startIso).getTime();
    const t1 = new Date(endIso).getTime();
    if (Number.isNaN(t0) || Number.isNaN(t1)) return 0;
    return Math.max(0, Math.round((t1 - t0) / 86400000));
  }

  /** Total time from opening to closing (settled files). */
  closedProcessingLabel(c: Claim): string {
    if (!c.openingDate || !c.closingDate) return '—';
    const ms = new Date(c.closingDate).getTime() - new Date(c.openingDate).getTime();
    return formatDurationMs(ms);
  }

  /** Live elapsed since declaration for open / in-progress files. */
  openElapsedLabel(c: Claim): string {
    this.nowMs();
    if (!c.openingDate) return '—';
    const ms = Date.now() - new Date(c.openingDate).getTime();
    return formatDurationMs(ms);
  }

  isTerminal(c: Claim): boolean {
    return c.status === ClaimStatus.CLOSED || c.status === ClaimStatus.REJECTED;
  }
}
