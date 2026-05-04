import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { ClaimService } from '../../../core/services/claim.service';
import {
  Claim, ClaimStatus, Expert,
  STATUS_LABELS, STATUS_CSS, expertFullName,
} from '../../../core/models/claim.model';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatButtonModule, MatIconModule, MatCheckboxModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './claims-list.component.html',
  styleUrls: ['./claims-list.component.scss']
})
export class ClaimsListComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  claims: Claim[] = [];
  filteredClaims: Claim[] = [];
  availableExperts: Expert[] = [];

  loading = true;
  saving = false;
  deletingId?: number;
  assigningId?: number;
  error = '';
  successMsg = '';

  searchQuery = '';
  activeStatus: ClaimStatus | 'ALL' = 'ALL';
  activeRegion = '';
  regions: string[] = [];
  showAdvancedFilters = false;
  filters = {
    urgencyMin: null as number | null,
    urgencyMax: null as number | null,
    dateDebut: null as string | null,
    dateFin: null as string | null
  };

  currentPage = 0;
  pageSize = 10;
  selectedIds = new Set<number>();

  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showAssignModal = false;
  claimToDelete?: Claim;
  claimToEdit?: Claim;
  claimToAssign?: Claim;
  selectedExpertId?: number;

  createForm!: FormGroup;
  editForm!: FormGroup;

  readonly ClaimStatus = ClaimStatus;
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_CSS = STATUS_CSS;
  readonly expertFullName = expertFullName;
  readonly ALL_STATUSES = Object.values(ClaimStatus);

  readonly STATUS_FILTERS = [
    { key: 'ALL' as const, label: 'Tous' },
    { key: ClaimStatus.OPENED, label: 'Ouverts' },
    { key: ClaimStatus.ASSIGNED_TO_EXPERT, label: 'Assignés' },
    { key: ClaimStatus.UNDER_EXPERTISE, label: 'En expertise' },
    { key: ClaimStatus.CLOSED, label: 'Clôturés' },
    { key: ClaimStatus.REJECTED, label: 'Rejetés' },
  ];

  constructor(
    private fb: FormBuilder,
    public claimService: ClaimService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadClaims();
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['status']) this.activeStatus = params['status'] as ClaimStatus;
      if (params['region']) this.activeRegion = params['region'];
      if (this.claims.length) this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForms(): void {
    this.createForm = this.fb.group({
      accidentId: [null, [Validators.required, Validators.min(1)]],
      insurerId: [1, [Validators.required]],
    });
    this.editForm = this.fb.group({
      region: ['', Validators.required],
      notes: [''],
      urgencyScore: [null, [Validators.min(0), Validators.max(100)]],
      status: ['', Validators.required],
    });
  }

  loadClaims(): void {
    this.loading = true;
    this.error = '';
    this.claimService.getAllClaims().pipe(
      takeUntil(this.destroy$),
      finalize(() => this.loading = false),
    ).subscribe({
      next: claims => {
        this.claims = claims;
        this.regions = [...new Set(claims.map(c => c.region).filter(Boolean))].sort();
        this.applyFilters();
      },
      error: err => {
        this.error = `Erreur de chargement : ${err.status === 0 ? 'Backend inaccessible' : err.message}`;
      },
    });
  }

  applyFilters(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredClaims = this.claims.filter(claim => {
      const matchStatus = this.activeStatus === 'ALL' || claim.status === this.activeStatus;
      const matchRegion = !this.activeRegion || claim.region === this.activeRegion;
      const matchSearch = !query
        || claim.reference.toLowerCase().includes(query)
        || (claim.region || '').toLowerCase().includes(query)
        || (claim.expert ? expertFullName(claim.expert).toLowerCase().includes(query) : false);
      const matchUrgencyMin = !this.filters.urgencyMin || (claim.urgencyScore ?? 0) >= this.filters.urgencyMin;
      const matchUrgencyMax = !this.filters.urgencyMax || (claim.urgencyScore ?? 0) <= this.filters.urgencyMax;
      const matchDateDebut = !this.filters.dateDebut || new Date(claim.openingDate) >= new Date(this.filters.dateDebut);
      const matchDateFin = !this.filters.dateFin || new Date(claim.openingDate) <= new Date(this.filters.dateFin);
      return matchStatus && matchRegion && matchSearch && matchUrgencyMin && matchUrgencyMax && matchDateDebut && matchDateFin;
    });
    this.currentPage = 0;
    this.selectedIds.clear();
  }

  setStatusFilter(status: ClaimStatus | 'ALL'): void { this.activeStatus = status; this.applyFilters(); }
  setRegionFilter(region: string): void { this.activeRegion = region; this.applyFilters(); }
  resetFilters(): void { this.searchQuery = ''; this.activeStatus = 'ALL'; this.activeRegion = ''; this.applyFilters(); }
  countByStatus(status: ClaimStatus): number { return this.claims.filter(c => c.status === status).length; }
  resetAdvancedFilters(): void {
    this.filters = { urgencyMin: null, urgencyMax: null, dateDebut: null, dateFin: null };
    this.applyFilters();
  }

  // ── CREATE ────────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm.reset({ insurerId: 1 });
    this.showCreateModal = true;
  }

  submitCreate(): void {
    if (this.createForm.invalid) { this.createForm.markAllAsTouched(); return; }
    this.saving = true;
    const { accidentId, insurerId } = this.createForm.value;
    this.claimService.createClaimFromAccident(accidentId, insurerId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.saving = false),
    ).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.showSuccess('Sinistre créé avec succès');
        this.loadClaims();
      },
      error: (err) => {
        if (err.status === 201 || (err.error && err.status === 200)) {
          this.showCreateModal = false;
          this.showSuccess('Sinistre créé avec succès');
          this.loadClaims();
        } else {
          this.showError(`Création impossible : ${err.message || 'Erreur inconnue'}`);
        }
      },
    });
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────

  openEditModal(claim: Claim, event: Event): void {
    event.stopPropagation();
    // #region agent log
    fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H1', location: 'claims-list.component.ts:openEditModal', message: 'openEditModal', data: { claimId: claim.id, refLen: (claim.reference || '').length }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
    // #endregion
    this.claimToEdit = claim;
    this.editForm.patchValue({
      region: claim.region,
      notes: claim.notes ?? '',
      urgencyScore: claim.urgencyScore ?? null,
      status: claim.status,
    });
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.claimToEdit) { this.editForm.markAllAsTouched(); return; }
    // #region agent log
    fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H3', location: 'claims-list.component.ts:submitEdit', message: 'submitEdit start', data: { claimId: this.claimToEdit.id, invalid: this.editForm.invalid }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
    // #endregion
    this.saving = true;
    this.claimService.updateClaim(this.claimToEdit.id, this.editForm.value).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.saving = false),
    ).subscribe({
      next: updated => {
        // #region agent log
        fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H4', location: 'claims-list.component.ts:submitEdit', message: 'submitEdit ok', data: { id: updated.id, status: updated.status, regionLen: (updated.region || '').length, urgency: updated.urgencyScore }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
        // #endregion
        const index = this.claims.findIndex(c => c.id === updated.id);
        if (index !== -1) this.claims[index] = updated;
        this.applyFilters();
        this.showEditModal = false;
        this.showSuccess('Sinistre mis à jour');
      },
      error: err => {
        // #region agent log
        fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H3', location: 'claims-list.component.ts:submitEdit', message: 'submitEdit err', data: { status: err?.status }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
        // #endregion
        this.showError(`Mise à jour impossible : ${err.error || err.message}`);
      },
    });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  openDeleteModal(claim: Claim, event: Event): void {
    event.stopPropagation();
    // #region agent log
    fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H1', location: 'claims-list.component.ts:openDeleteModal', message: 'openDeleteModal', data: { claimId: claim.id }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
    // #endregion
    this.claimToDelete = claim;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.claimToDelete) return;
    // #region agent log
    fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H5', location: 'claims-list.component.ts:confirmDelete', message: 'confirmDelete start', data: { claimId: this.claimToDelete.id }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
    // #endregion
    this.deletingId = this.claimToDelete.id;
    this.claimService.deleteClaim(this.claimToDelete.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.deletingId = undefined),
    ).subscribe({
      next: () => {
        // #region agent log
        fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H5', location: 'claims-list.component.ts:confirmDelete', message: 'confirmDelete ok', data: {}, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
        // #endregion
        this.claims = this.claims.filter(c => c.id !== this.claimToDelete!.id);
        this.applyFilters();
        this.showDeleteModal = false;
        this.showSuccess('Sinistre supprimé');
      },
      error: err => {
        // #region agent log
        fetch('http://127.0.0.1:7458/ingest/2de376a7-a5d8-4b1c-9f1e-ec7e4eee686b', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '1f08e1' }, body: JSON.stringify({ sessionId: '1f08e1', hypothesisId: 'H5', location: 'claims-list.component.ts:confirmDelete', message: 'confirmDelete err', data: { status: err?.status }, timestamp: Date.now(), runId: 'post-fix' }) }).catch(() => {});
        // #endregion
        this.showError(`Suppression impossible : ${err.error || err.message}`);
      },
    });
  }

  deleteBatch(): void {
    if (!this.selectedIds.size) return;
    if (!confirm(`Supprimer ${this.selectedIds.size} sinistre(s) ?`)) return;
    this.claimService.deleteBatch([...this.selectedIds]).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.claims = this.claims.filter(c => !this.selectedIds.has(c.id));
        this.selectedIds.clear();
        this.applyFilters();
        this.showSuccess('Sinistres supprimés');
      },
      error: err => this.showError(`Erreur suppression : ${err.message}`),
    });
  }

  // ── ASSIGN ────────────────────────────────────────────────────────────────

  openAssignModal(claim: Claim, event: Event): void {
    event.stopPropagation();
    this.claimToAssign = claim;
    this.selectedExpertId = undefined;
    this.showAssignModal = true;
    this.claimService.getAvailableExperts().pipe(takeUntil(this.destroy$)).subscribe({
      next: experts => { this.availableExperts = experts; },
      error: () => { this.availableExperts = []; },
    });
  }

  confirmAssign(): void {
    if (!this.claimToAssign || !this.selectedExpertId) return;
    this.assigningId = this.claimToAssign.id;
    this.claimService.assignExpert(this.claimToAssign.id, this.selectedExpertId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.assigningId = undefined),
    ).subscribe({
      next: () => {
        this.showAssignModal = false;
        this.showSuccess('Expert assigné avec succès — email envoyé');
        this.loadClaims();
      },
      error: err => this.showError(`Assignation impossible : ${err.error || err.message}`),
    });
  }

  autoAssign(claim: Claim, event: Event): void {
    event.stopPropagation();
    this.assigningId = claim.id;
    this.claimService.autoAssignExpert(claim.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.assigningId = undefined),
    ).subscribe({
      next: updated => {
        const index = this.claims.findIndex(c => c.id === updated.id);
        if (index !== -1) this.claims[index] = updated;
        this.applyFilters();
        this.showSuccess(`Expert assigné automatiquement : ${updated.expert ? expertFullName(updated.expert) : ''}`);
      },
      error: err => this.showError(`Auto-assignation impossible : ${err.error || err.message}`),
    });
  }

  // ── NAVIGATION ────────────────────────────────────────────────────────────

  goToDetail(id: number): void {
    this.router.navigate(['/assureur/claims', id]);
  }

  goAssignGarage(claimId: number, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/assureur/claims', claimId, 'garage']);
  }

  // ── SELECTION ─────────────────────────────────────────────────────────────

  toggleAll(checked: boolean): void {
    if (checked) { this.pagedClaims.forEach(c => this.selectedIds.add(c.id)); }
    else { this.selectedIds.clear(); }
  }

  toggleOne(id: number): void {
    if (this.selectedIds.has(id)) { this.selectedIds.delete(id); }
    else { this.selectedIds.add(id); }
  }

  get allPageSelected(): boolean {
    return this.pagedClaims.length > 0 && this.pagedClaims.every(c => this.selectedIds.has(c.id));
  }

  // ── PAGINATION ────────────────────────────────────────────────────────────

  get pagedClaims(): Claim[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredClaims.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filteredClaims.length / this.pageSize); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i); }

  trackById(_index: number, claim: Claim): number { return claim.id; }

  canAssign(claim: Claim): boolean {
    return claim.status === ClaimStatus.OPENED || claim.status === ClaimStatus.ASSIGNED_TO_EXPERT;
  }

  expertName(claim: Claim): string {
    return claim.expert ? expertFullName(claim.expert) : '—';
  }

  private showSuccess(message: string): void {
    this.successMsg = message;
    setTimeout(() => this.successMsg = '', 4000);
  }

  private showError(message: string): void {
    this.error = message;
    setTimeout(() => this.error = '', 6000);
  }
}