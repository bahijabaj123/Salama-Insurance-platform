import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import type { LoginApiErrorBody } from '../../../core/auth/login.models';
import type { DeviceResponse } from '../../../core/users/device.models';
import { AdminApiService } from '../../core/admin-api.service';
import type { AdminPage, AdminUserRow } from '../../core/admin.models';

@Component({
  selector: 'app-admin-user-devices',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './admin-user-devices.component.html',
  styleUrl: './admin-user-devices.component.scss'
})
export class AdminUserDevicesComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authStorage = inject(AuthStorageService);

  /* ---------------- Search state ---------------- */

  readonly form = this.fb.group({
    query: this.fb.control('', { validators: [Validators.required] })
  });

  readonly searching = signal(false);
  readonly searchError = signal<string | null>(null);
  readonly searchResults = signal<AdminUserRow[]>([]);
  /** True after a search ran but returned no users (text search only). */
  readonly searchNoResults = signal(false);

  /* ---------------- Selection / devices state ---------------- */

  readonly selectedUser = signal<AdminUserRow | null>(null);
  readonly devices = signal<DeviceResponse[]>([]);
  readonly devicesLoading = signal(false);
  readonly devicesError = signal<string | null>(null);

  constructor() {
    // Reset transient errors when the user edits the input.
    this.form.controls.query.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.searchError()) this.searchError.set(null);
      if (this.searchNoResults()) this.searchNoResults.set(false);
    });
  }

  /* ---------------- Actions ---------------- */

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = (this.form.controls.query.value ?? '').trim();
    if (!raw) return;

    this.searchError.set(null);
    this.searchNoResults.set(false);
    this.searchResults.set([]);

    if (this.isPositiveInteger(raw)) {
      // Numeric: treat as user id and load devices directly.
      const id = Number(raw);
      this.loadDevicesForId(id, /* userRow */ null);
      return;
    }

    // Text: search admin users API.
    this.searching.set(true);
    this.api
      .getUsers({ page: 0, size: 10, search: raw, sort: 'createdAt,desc' })
      .pipe(finalize(() => this.searching.set(false)))
      .subscribe({
        next: (res: AdminPage<AdminUserRow> | AdminUserRow[]) => {
          const list = Array.isArray(res) ? res : res?.content ?? [];
          this.searchResults.set(list);
          this.searchNoResults.set(list.length === 0);
        },
        error: (err: unknown) => {
          this.searchError.set(this.resolveMessage(err, 'Unable to search users right now.'));
        }
      });
  }

  selectUser(user: AdminUserRow): void {
    this.searchResults.set([]);
    this.searchNoResults.set(false);
    this.loadDevicesForId(user.id, user);
  }

  reloadDevices(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.loadDevicesForId(user.id, user);
  }

  clearSelection(): void {
    this.selectedUser.set(null);
    this.devices.set([]);
    this.devicesError.set(null);
    this.searchResults.set([]);
    this.searchNoResults.set(false);
    this.form.controls.query.setValue('');
  }

  /* ---------------- Helpers ---------------- */

  /**
   * Best-effort, dependency-free user-agent label.
   * The raw UA is intentionally not displayed in the table.
   */
  describeDevice(userAgent: string | null | undefined): string {
    const ua = (userAgent ?? '').trim();
    if (!ua) return 'Unknown device';

    const browser =
      /Edg\//i.test(ua) ? 'Edge'
      : /OPR\/|Opera/i.test(ua) ? 'Opera'
      : /Chrome\//i.test(ua) && !/Chromium/i.test(ua) ? 'Chrome'
      : /Firefox\//i.test(ua) ? 'Firefox'
      : /Safari\//i.test(ua) && !/Chrome\//i.test(ua) ? 'Safari'
      : 'Browser';

    const os =
      /Windows NT 10/i.test(ua) ? 'Windows 10/11'
      : /Windows NT/i.test(ua) ? 'Windows'
      : /Mac OS X|Macintosh/i.test(ua) ? 'macOS'
      : /Android/i.test(ua) ? 'Android'
      : /iPhone|iPad|iPod/i.test(ua) ? 'iOS'
      : /Linux/i.test(ua) ? 'Linux'
      : 'Unknown OS';

    return `${browser} on ${os}`;
  }

  /* ---------------- Private ---------------- */

  private loadDevicesForId(userId: number, userRow: AdminUserRow | null): void {
    this.devicesLoading.set(true);
    this.devicesError.set(null);
    this.devices.set([]);
    this.selectedUser.set(userRow);

    // If the search input was a raw id, hydrate the user summary lazily.
    if (!userRow) {
      this.api.getUsers({ page: 0, size: 1, search: String(userId) }).subscribe({
        next: (res: AdminPage<AdminUserRow> | AdminUserRow[]) => {
          const list = Array.isArray(res) ? res : res?.content ?? [];
          // Only adopt the row if its id strictly matches what was requested.
          const match = list.find((u) => u.id === userId) ?? null;
          this.selectedUser.set(match);
        },
        error: () => {
          // We still try to show the devices even if the user summary failed.
        }
      });
    }

    this.api
      .getUserDevices(userId)
      .pipe(finalize(() => this.devicesLoading.set(false)))
      .subscribe({
        next: (list) => this.devices.set(Array.isArray(list) ? list : []),
        error: (err: unknown) => this.handleDevicesError(err)
      });
  }

  private handleDevicesError(err: unknown): void {
    if (err instanceof HttpErrorResponse && err.status === 401) {
      this.authStorage.clear();
      this.devicesError.set('Your session has expired. Please sign in again.');
      return;
    }
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.devicesError.set('No user found with that id.');
      this.selectedUser.set(null);
      return;
    }
    this.devicesError.set(this.resolveMessage(err, 'Unable to load devices.'));
  }

  private resolveMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && err.status === 0) {
      return 'Unable to reach the server. Check your connection.';
    }
    if (err instanceof HttpErrorResponse) {
      const body = err.error as LoginApiErrorBody | string | null | undefined;
      if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
        return body.message;
      }
    }
    return fallback;
  }

  private isPositiveInteger(s: string): boolean {
    return /^\d+$/.test(s) && Number(s) > 0;
  }
}
