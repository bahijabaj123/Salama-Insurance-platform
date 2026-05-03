import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs/operators';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import type { LoginApiErrorBody } from '../../../core/auth/login.models';
import { AdminApiService } from '../../core/admin-api.service';
import type { AdminUserRow } from '../../core/admin.models';

type State = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-role-requests',
    standalone: true,
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTableModule, MatSnackBarModule],
  templateUrl: './admin-role-requests.component.html',
  styleUrl: './admin-role-requests.component.scss'
})
export class AdminRoleRequestsComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly authStorage = inject(AuthStorageService);
  private readonly snackBar = inject(MatSnackBar);

  readonly state = signal<State>('loading');
  readonly error = signal<string | null>(null);
  readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  readonly rows = signal<AdminUserRow[]>([]);
  readonly actingUserId = signal<number | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.state.set('loading');
    this.error.set(null);
    this.message.set(null);

    this.api
      .getPendingRoleRequests()
      .pipe(finalize(() => {}))
      .subscribe({
        next: (list) => {
          this.rows.set(list ?? []);
          this.state.set('ready');
        },
        error: (err: unknown) => this.handleLoadError(err)
      });
  }

  approve(userId: number): void {
    this.act(userId, 'approve');
  }

  reject(userId: number): void {
    this.act(userId, 'reject');
  }

  private act(userId: number, action: 'approve' | 'reject'): void {
    if (this.actingUserId()) return;
    this.message.set(null);
    this.actingUserId.set(userId);

    const request$ = action === 'approve' ? this.api.approveRole(userId) : this.api.rejectRole(userId);
    request$
      .pipe(finalize(() => this.actingUserId.set(null)))
      .subscribe({
        next: () => {
          this.message.set({
            type: 'success',
            text: action === 'approve' ? 'Role request approved.' : 'Role request rejected.'
          });
          this.snackBar.open(action === 'approve' ? 'Approved' : 'Rejected', 'Dismiss', {
            duration: 2500
          });
          // Immediate refresh to keep workflow consistent.
          this.refresh();
        },
        error: (err: unknown) => this.handleActionError(err)
      });
  }

  private handleLoadError(err: unknown): void {
    this.state.set('error');
    this.error.set(this.resolveMessage(err, 'Unable to load pending role requests.'));
  }

  private handleActionError(err: unknown): void {
    this.message.set({ type: 'error', text: this.resolveMessage(err, 'Action failed. Please try again.') });
    this.snackBar.open('Action failed', 'Dismiss', { duration: 2500 });
  }

  private resolveMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      return 'Your session has expired. Please sign in again.';
    }

    if (err instanceof HttpErrorResponse && err.status === 403) {
      return 'Access denied.';
    }

    if (err instanceof HttpErrorResponse && err.status === 404) {
      return 'User not found.';
    }

    if (!(err instanceof HttpErrorResponse)) {
      return fallback;
    }

    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      return body.message;
    }
    return fallback;
  }
}

