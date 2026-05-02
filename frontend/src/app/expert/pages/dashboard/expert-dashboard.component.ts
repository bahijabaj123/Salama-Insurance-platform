import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

import { ExpertService } from '../../services/expert.service';
import { RapportExpertiseChatService } from '../../services/rapport-expertise-chat.service';
import { Expert } from '../../models/expert.model';

@Component({
  selector: 'app-expert-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './expert-dashboard.component.html',
  styleUrl: './expert-dashboard.component.scss'
})
export class ExpertDashboardComponent implements OnInit, OnDestroy {
  experts = signal<Expert[]>([]);
  filteredExperts = signal<Expert[]>([]);
  loading = signal(false);
  error = signal('');
  searchQuery = '';
  selectedStatus = '';
  showDeleteModal = signal(false);
  expertToDelete = signal<Expert | null>(null);
  deleteLoading = signal(false);
  successMessage = signal('');
  dashboardByExpert = signal<Map<number, Record<string, unknown>>>(new Map());
  hoveredExpert = signal<Expert | null>(null);
  popoverTop = signal(0);
  popoverLeft = signal(0);
  popoverPlacement = signal<'below' | 'above'>('below');

  private hoverLeaveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly popoverWidth = 300;
  /** Évite un spinner infini si le backend ne répond pas (connexion bloquée, DDL Hibernate, etc.). */
  private readonly httpTimeoutMs = 15000;

  constructor(
    private expertService: ExpertService,
    private rapportChatService: RapportExpertiseChatService
  ) {}

  ngOnInit(): void {
    this.loadExperts();
    this.loadDashboardScorecards();
  }

  ngOnDestroy(): void {
    if (this.hoverLeaveTimer) clearTimeout(this.hoverLeaveTimer);
  }

  private loadDashboardScorecards(): void {
    this.rapportChatService
      .getExpertDashboardComplet()
      .pipe(
        timeout(this.httpTimeoutMs),
        catchError(() => of(null)),
      )
      .subscribe({
      next: (raw) => {
        if (!raw || typeof raw !== 'object') return;
        const list = raw['scorecards'];
        if (!Array.isArray(list)) return;
        const map = new Map<number, Record<string, unknown>>();
        for (const row of list) {
          if (!row || typeof row !== 'object') continue;
          const r = row as Record<string, unknown>;
          const id = r['idExpert'];
          if (typeof id === 'number') map.set(id, r);
        }
        this.dashboardByExpert.set(map);
      },
      error: () => {}
    });
  }

  scorecardFor(expert: Expert): Record<string, unknown> | null {
    const id = expert.idExpert;
    if (id == null) return null;
    return this.dashboardByExpert().get(id) ?? null;
  }

  hoverStatsLines(expert: Expert): { label: string; value: string; accent?: boolean }[] {
    const lines: { label: string; value: string; accent?: boolean }[] = [];

    if (expert.performanceScore != null) {
      lines.push({ label: 'Performance', value: `${expert.performanceScore} %`, accent: true });
    }
    if (expert.activeClaims != null) {
      lines.push({ label: 'Sinistres actifs', value: this.fmtNum(expert.activeClaims) });
    }
    if (expert.maxWorkload != null && expert.maxWorkload > 0 && expert.currentWorkload != null) {
      lines.push({
        label: 'Charge',
        value: `${this.fmtNum(expert.currentWorkload)} / ${this.fmtNum(expert.maxWorkload)}`
      });
    } else if (expert.currentWorkload != null) {
      lines.push({ label: 'Charge courante', value: this.fmtNum(expert.currentWorkload) });
    }
    if (expert.available != null) {
      lines.push({ label: 'Disponibilite', value: expert.available ? 'Oui' : 'Non' });
    }
    if (expert.validationRate != null) {
      lines.push({ label: 'Taux validation', value: `${this.fmtNum(expert.validationRate)} %` });
    }

    const sc = this.scorecardFor(expert);
    if (sc) {
      const perf = sc['performance'];
      if (perf && typeof perf === 'object' && !Array.isArray(perf)) {
        const p = perf as Record<string, unknown>;
        if (p['score'] != null && p['max'] != null) {
          lines.push({
            label: 'Score BI',
            value: `${this.fmtNum(p['score'])} / ${this.fmtNum(p['max'])}${p['niveau'] != null ? ` · ${p['niveau']}` : ''}`,
            accent: expert.performanceScore == null
          });
        }
      }
    }

    return lines.slice(0, 10);
  }

  expertRowEnter(expert: Expert, event: MouseEvent): void {
    if (this.hoverLeaveTimer) {
      clearTimeout(this.hoverLeaveTimer);
      this.hoverLeaveTimer = null;
    }
    const tr = event.currentTarget as HTMLElement;
    const rect = tr.getBoundingClientRect();
    const margin = 10;
    const estHeight = 220;
    let top: number;
    let placement: 'below' | 'above' = 'below';
    if (rect.bottom + 6 + estHeight > window.innerHeight - margin) {
      top = rect.top - 6;
      placement = 'above';
    } else {
      top = rect.bottom + 6;
    }
    let left = rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - this.popoverWidth - margin));

    this.popoverTop.set(top);
    this.popoverLeft.set(left);
    this.popoverPlacement.set(placement);
    this.hoveredExpert.set(expert);
  }

  expertRowLeave(): void {
    this.hoverLeaveTimer = setTimeout(() => {
      this.hoveredExpert.set(null);
      this.hoverLeaveTimer = null;
    }, 180);
  }

  expertRowEnterCancelLeave(): void {
    if (this.hoverLeaveTimer) {
      clearTimeout(this.hoverLeaveTimer);
      this.hoverLeaveTimer = null;
    }
  }

  fmtNum(v: unknown): string {
    if (v == null || v === '') return '—';
    if (typeof v === 'number' && Number.isFinite(v)) {
      return Number.isInteger(v) ? String(v) : v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    }
    const n = parseFloat(String(v).replace(',', '.'));
    if (Number.isFinite(n)) {
      return Number.isInteger(n) ? String(n) : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
    }
    return String(v);
  }

  loadExperts(): void {
    this.loading.set(true);
    this.error.set('');
    this.expertService
      .getAll()
      .pipe(
        timeout(this.httpTimeoutMs),
        catchError(() => {
          this.error.set(
            'Impossible de charger les experts (timeout ou serveur indisponible). Verifiez que le backend tourne sur le port 8082.',
          );
          return of([] as Expert[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
      next: (data) => {
        this.experts.set(data);
        this.applyFilters();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase();
    const status = this.selectedStatus;
    const filtered = this.experts().filter((e) => {
      const matchSearch =
        !query ||
        e.firstName?.toLowerCase().includes(query) ||
        e.lastName?.toLowerCase().includes(query) ||
        e.email?.toLowerCase().includes(query) ||
        e.specialty?.toLowerCase().includes(query) ||
        e.city?.toLowerCase().includes(query);
      const matchStatus = !status || e.status === status;
      return matchSearch && matchStatus;
    });
    this.filteredExperts.set(filtered);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusFilter(): void {
    this.applyFilters();
  }

  confirmDelete(expert: Expert): void {
    this.expertToDelete.set(expert);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.expertToDelete.set(null);
  }

  deleteExpert(): void {
    const expert = this.expertToDelete();
    if (!expert?.idExpert) return;
    this.deleteLoading.set(true);
    this.expertService.delete(expert.idExpert).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.expertToDelete.set(null);
        this.deleteLoading.set(false);
        this.successMessage.set(`Expert ${expert.firstName} ${expert.lastName} supprime avec succes.`);
        setTimeout(() => this.successMessage.set(''), 3000);
        this.loadExperts();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        this.error.set('Erreur lors de la suppression.');
        console.error(err);
      }
    });
  }

  getStatusClass(status?: string): string {
    return status === 'ACTIVE' || status === 'AVAILABLE' ? 'badge-active' : 'badge-inactive';
  }

  getInitials(expert: Expert): string {
    return `${(expert.firstName || 'X')[0]}${(expert.lastName || 'X')[0]}`.toUpperCase();
  }

  getAvatarColor(id?: number): string {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];
    return colors[(id || 0) % colors.length];
  }

  getPhoto(expert: Expert): string | null {
    const candidate = expert.photo || expert.photoUrl || expert.avatar;
    if (!candidate || !candidate.trim()) return null;
    const trimmed = candidate.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  }

  get totalExperts(): number {
    return this.experts().length;
  }

  get activeExperts(): number {
    return this.experts().filter((e) => e.status === 'ACTIVE' || e.status === 'AVAILABLE').length;
  }

  get inactiveExperts(): number {
    return this.experts().filter((e) => e.status === 'INACTIVE' || e.status === 'UNAVAILABLE').length;
  }
}
