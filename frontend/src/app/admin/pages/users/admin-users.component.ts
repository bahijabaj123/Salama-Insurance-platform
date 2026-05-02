import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import type { LoginApiErrorBody } from '../../../core/auth/login.models';
import { AdminApiService } from '../../core/admin-api.service';
import type { AdminPage, AdminUserRow } from '../../core/admin.models';

type LoadState = 'idle' | 'loading' | 'error' | 'ready';

@Component({
  selector: 'app-admin-users',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly authStorage = inject(AuthStorageService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly state = signal<LoadState>('idle');
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly unlockingId = signal<number | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  readonly rows = signal<AdminUserRow[]>([]);

  readonly displayedColumns = [
    'fullName',
    'email',
    'role',
    'requestedRole',
    'approvalStatus',
    'enabled',
    'locked',
    'createdAt',
    'actions'
  ] as const;

  readonly filters = this.fb.group({
    search: this.fb.control(''),
    role: this.fb.control(''),
    approvalStatus: this.fb.control(''),
    enabled: this.fb.control(''),
    locked: this.fb.control('')
  });

  readonly showingRange = computed(() => {
    const total = this.totalElements();
    if (total === 0) return '0';
    const start = this.pageIndex() * this.pageSize() + 1;
    const end = Math.min(total, start + this.rows().length - 1);
    return `${start}–${end} of ${total}`;
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const lockedParam = qp.get('locked');
    if (lockedParam === 'true' || lockedParam === 'false') {
      this.filters.controls.locked.setValue(lockedParam);
    }
    const roleParam = qp.get('role');
    if (roleParam) {
      this.filters.controls.role.setValue(roleParam);
    }
    const approvalParam = qp.get('approvalStatus');
    if (approvalParam) {
      this.filters.controls.approvalStatus.setValue(approvalParam);
    }

    this.load();
  }

  load(resetPage = false): void {
    if (resetPage) {
      this.pageIndex.set(0);
      this.notice.set(null);
    }

    this.state.set('loading');
    this.error.set(null);

    const f = this.filters.getRawValue();
    const enabled = f.enabled === '' ? undefined : f.enabled === 'true';
    const locked = f.locked === '' ? undefined : f.locked === 'true';

    this.api
      .getUsers({
        page: this.pageIndex(),
        size: this.pageSize(),
        sort: 'createdAt,desc',
        search: f.search?.trim() || undefined,
        role: f.role || undefined,
        approvalStatus: f.approvalStatus || undefined,
        enabled,
        locked
      })
      .pipe(finalize(() => {}))
      .subscribe({
        next: (res) => {
          if (Array.isArray(res)) {
            // Fallback if backend returns a list without pagination.
            this.rows.set(res);
            this.totalElements.set(res.length);
            this.totalPages.set(1);
            this.state.set('ready');
            return;
          }

          const page = res as AdminPage<AdminUserRow>;
          this.rows.set(page.content ?? []);
          this.totalElements.set(page.totalElements ?? 0);
          this.totalPages.set(page.totalPages ?? 0);
          this.state.set('ready');
        },
        error: (err: unknown) => this.handleError(err)
      });
  }

  clearFilters(): void {
    this.filters.reset({ search: '', role: '', approvalStatus: '', enabled: '', locked: '' });
    this.load(true);
  }

  goPrev(): void {
    if (this.pageIndex() <= 0) return;
    this.pageIndex.update((v) => v - 1);
    this.load(false);
  }

  goNext(): void {
    if (this.pageIndex() + 1 >= this.totalPages()) return;
    this.pageIndex.update((v) => v + 1);
    this.load(false);
  }

  unlock(user: AdminUserRow): void {
    if (!user || this.unlockingId() !== null) return;

    this.unlockingId.set(user.id);
    this.notice.set(null);
    this.error.set(null);

    this.api
      .setUserLocked(user.id, false)
      .pipe(finalize(() => this.unlockingId.set(null)))
      .subscribe({
        next: () => {
          this.notice.set(`${user.fullName || user.email} has been unlocked.`);
          // Refresh the current page without resetting filters/pagination
          // so the admin stays in context after the action.
          this.load(false);
          // Auto-dismiss the notice after a short delay.
          setTimeout(() => {
            const current = this.notice();
            if (current && (current.includes(user.email) || current.includes(user.fullName))) {
              this.notice.set(null);
            }
          }, 4000);
        },
        error: (err: unknown) => this.handleActionError(err, 'Unable to unlock this account. Please try again.')
      });
  }

  private handleActionError(err: unknown, fallback: string): void {
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      this.error.set('Your session has expired. Please sign in again.');
      return;
    }
    const body = err instanceof HttpErrorResponse ? (err.error as LoginApiErrorBody | string | null | undefined) : null;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      this.error.set(body.message);
      return;
    }
    this.error.set(fallback);
  }

  dismissNotice(): void {
    this.notice.set(null);
  }

  private handleError(err: unknown): void {
    this.state.set('error');
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      this.error.set('Your session has expired. Please sign in again.');
      return;
    }
    const body = err instanceof HttpErrorResponse ? (err.error as LoginApiErrorBody | string | null | undefined) : null;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      this.error.set(body.message);
      return;
    }
    this.error.set('Unable to load users. Please try again.');
  }
}

