import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
// Services
import { ClaimService } from '../../../core/services/claim.service';

// Models
import {
  Claim,
  ClaimStatus,
  Expert,
  STATUS_LABELS,
  STATUS_CSS,
  expertFullName,
} from '../../../core/models/claim.model';

// Angular Material Imports
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
     CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './claims-list.component.html',
  styleUrls: ['./claims-list.component.scss']
})
export class ClaimsListComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── Data ──────────────────────────────────────────────────────────────────
  claims: Claim[] = [];
  filteredClaims: Claim[] = [];
  availableExperts: Expert[] = [];

  // ── Loading ───────────────────────────────────────────────────────────────
  loading = true;
  saving = false;
  deletingId?: number;
  assigningId?: number;
  error = '';
  successMsg = '';

  // ── Filtres ───────────────────────────────────────────────────────────────
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

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 0;
  pageSize = 10;

  // ── Sélection batch ───────────────────────────────────────────────────────
  selectedIds = new Set<number>();

  // ── Modal état ────────────────────────────────────────────────────────────
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showAssignModal = false;
  claimToDelete?: Claim;
  claimToEdit?: Claim;
  claimToAssign?: Claim;
  selectedExpertId?: number;

  // ── Formulaire création ───────────────────────────────────────────────────
  createForm!: FormGroup;

  // ── Formulaire édition ────────────────────────────────────────────────────
  editForm!: FormGroup;

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly ClaimStatus = ClaimStatus;
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly STATUS_CSS = STATUS_CSS;
  readonly expertFullName = expertFullName;

  readonly ALL_STATUSES = Object.values(ClaimStatus);

  readonly STATUS_FILTERS = [
    { key: 'ALL' as const, label: 'All' },
    { key: ClaimStatus.OPENED, label: 'Open' },
    { key: ClaimStatus.ASSIGNED_TO_EXPERT, label: 'Assigned' },
    { key: ClaimStatus.UNDER_EXPERTISE, label: 'Under expertise' },
    { key: ClaimStatus.CLOSED, label: 'Closed' },
    { key: ClaimStatus.REJECTED, label: 'Rejected' },
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
      if (params['garageOk'] === '1') {
        const ref = params['ref'] ? String(params['ref']) : '';
        this.showSuccess(ref ? `Garage saved on claim ${ref}` : 'Garage saved on claim');
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { garageOk: null, ref: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
      if (this.claims.length) this.applyFilters();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Formulaires ───────────────────────────────────────────────────────────

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

  // ── Chargement ────────────────────────────────────────────────────────────

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
        console.error('Erreur chargement:', err);
        this.error = `Load error: ${err.status === 0
          ? 'Backend unreachable (port 8080)'
          : err.message}`;
      },
    });
  }

  // ── Filtres ───────────────────────────────────────────────────────────────

  applyFilters(): void {
  const query = this.searchQuery.toLowerCase().trim();

  this.filteredClaims = this.claims.filter(claim => {
    // Filtres existants
    const matchStatus = this.activeStatus === 'ALL' || claim.status === this.activeStatus;
    const matchRegion = !this.activeRegion || claim.region === this.activeRegion;
    const matchSearch = !query
      || claim.reference.toLowerCase().includes(query)
      || (claim.region || '').toLowerCase().includes(query)
      || (claim.expert ? expertFullName(claim.expert).toLowerCase().includes(query) : false);
    
    // Filtres avancés
    const matchUrgencyMin = !this.filters.urgencyMin || (claim.urgencyScore ?? 0) >= this.filters.urgencyMin;
    const matchUrgencyMax = !this.filters.urgencyMax || (claim.urgencyScore ?? 0) <= this.filters.urgencyMax;
    const matchDateDebut = !this.filters.dateDebut || new Date(claim.openingDate) >= new Date(this.filters.dateDebut);
    const matchDateFin = !this.filters.dateFin || new Date(claim.openingDate) <= new Date(this.filters.dateFin);
    
    return matchStatus && matchRegion && matchSearch && matchUrgencyMin && matchUrgencyMax && matchDateDebut && matchDateFin;
  });

  this.currentPage = 0;
  this.selectedIds.clear();
}

  setStatusFilter(status: ClaimStatus | 'ALL'): void {
    this.activeStatus = status;
    this.applyFilters();
  }

  setRegionFilter(region: string): void {
    this.activeRegion = region;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.activeStatus = 'ALL';
    this.activeRegion = '';
    this.applyFilters();
  }

  countByStatus(status: ClaimStatus): number {
    return this.claims.filter(c => c.status === status).length;
  }

  resetAdvancedFilters(): void {
  this.filters = {
    urgencyMin: null,
    urgencyMax: null,
    dateDebut: null,
    dateFin: null
  };
  this.applyFilters();
}


  // ── CREATE ────────────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm.reset({ insurerId: 1 });
    this.showCreateModal = true;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    
    this.saving = true;
    const { accidentId, insurerId } = this.createForm.value;

    this.claimService.createClaimFromAccident(accidentId, insurerId).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.saving = false),
    ).subscribe({
      next: claim => {
        this.showCreateModal = false;
        this.showSuccess(`Claim ${claim.reference} created successfully`);
        this.loadClaims();
        
      },
      error: err => {
        console.error('Erreur création:', err);
        this.showError(`Could not create: ${err.error || err.message}`);
      },
    });
  }

  // ── EDIT ──────────────────────────────────────────────────────────────────

  openEditModal(claim: Claim, event: Event): void {
    event.stopPropagation();
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
    if (this.editForm.invalid || !this.claimToEdit) {
      this.editForm.markAllAsTouched();
      return;
    }
    
    this.saving = true;

    this.claimService.updateClaim(this.claimToEdit.id, this.editForm.value).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.saving = false),
    ).subscribe({
      next: updated => {
        const index = this.claims.findIndex(c => c.id === updated.id);
        if (index !== -1) this.claims[index] = updated;
        this.applyFilters();
        this.showEditModal = false;
        this.showSuccess('Claim updated');
      },
      error: err => {
        console.error('Erreur mise à jour:', err);
        this.showError(`Could not update: ${err.error || err.message}`);
      },
    });
  }

  // ── DELETE ────────────────────────────────────────────────────────────────

  openDeleteModal(claim: Claim, event: Event): void {
    event.stopPropagation();
    this.claimToDelete = claim;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.claimToDelete) return;
    
    this.deletingId = this.claimToDelete.id;

    this.claimService.deleteClaim(this.claimToDelete.id).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.deletingId = undefined),
    ).subscribe({
      next: () => {
        this.claims = this.claims.filter(c => c.id !== this.claimToDelete!.id);
        this.applyFilters();
        this.showDeleteModal = false;
        this.showSuccess('Claim deleted');
      },
      error: err => {
        console.error('Erreur suppression:', err);
        this.showError(`Could not delete: ${err.error || err.message}`);
      },
    });
  }

  // ── DELETE BATCH ──────────────────────────────────────────────────────────

  deleteBatch(): void {
    if (!this.selectedIds.size) return;
    if (!confirm(`Delete ${this.selectedIds.size} claim(s)?`)) return;

    this.claimService.deleteBatch([...this.selectedIds]).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: () => {
        this.claims = this.claims.filter(c => !this.selectedIds.has(c.id));
        this.selectedIds.clear();
        this.applyFilters();
        this.showSuccess('Claims deleted');
      },
      error: err => {
        console.error('Erreur suppression batch:', err);
        this.showError(`Delete error: ${err.message}`);
      },
    });
  }

  // ── ASSIGNATION ───────────────────────────────────────────────────────────

  openAssignModal(claim: Claim, event: Event): void {
    event.stopPropagation();
    this.claimToAssign = claim;
    this.selectedExpertId = undefined;
    this.showAssignModal = true;

    this.claimService.getAvailableExperts().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: experts => {
        this.availableExperts = experts;
      },
      error: err => {
        console.error('Erreur chargement experts:', err);
        this.availableExperts = [];
      },
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
        this.showSuccess('Expert assigned successfully — email sent');
        this.loadClaims();
      },
      error: err => {
        console.error('Erreur assignation:', err);
        this.showError(`Could not assign: ${err.error || err.message}`);
      },
    });
  }

  goAssignGarage(claimId: number, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/assureur/claims', claimId, 'garage']);
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
        this.showSuccess(`Expert auto-assigned: ${updated.expert ? expertFullName(updated.expert) : ''}`);
      },
      error: err => {
        console.error('Erreur auto-assignation:', err);
        this.showError(`Could not auto-assign: ${err.error || err.message}`);
      },
    });
  }

  // ── NAVIGATION ────────────────────────────────────────────────────────────

  goToDetail(id: number): void {
    this.router.navigate(['/assureur/claims', id]);
  }

  // ── SÉLECTION ─────────────────────────────────────────────────────────────

  toggleAll(checked: boolean): void {
    if (checked) {
      this.pagedClaims.forEach(claim => this.selectedIds.add(claim.id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleOne(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  get allPageSelected(): boolean {
    return this.pagedClaims.length > 0 && this.pagedClaims.every(c => this.selectedIds.has(c.id));
  }

  // ── PAGINATION ────────────────────────────────────────────────────────────

  get pagedClaims(): Claim[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredClaims.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClaims.length / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  trackById(_index: number, claim: Claim): number {
    return claim.id;
  }

  canAssign(claim: Claim): boolean {
    return claim.status === ClaimStatus.OPENED || claim.status === ClaimStatus.ASSIGNED_TO_EXPERT;
  }

  expertName(claim: Claim): string {
    return claim.expert ? expertFullName(claim.expert) : '—';
  }

  // ── Messages ──────────────────────────────────────────────────────────────

  private showSuccess(message: string): void {
    this.successMsg = message;
    setTimeout(() => this.successMsg = '', 4000);
  }

  private showError(message: string): void {
    this.error = message;
    setTimeout(() => this.error = '', 6000);
  }
}