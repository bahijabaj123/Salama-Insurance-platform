import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import type { DeviceResponse } from '../../core/users/device.models';
import type {
  AccountRatesResponse,
  AdminNotification,
  AdminPage,
  AdminUserRow,
  AdminUserSummary,
  AdminUsersByApprovalStatusResponse,
  AdminUsersByRoleResponse,
  UserGrowthResponse
} from './admin.models';

export type AdminUsersQuery = {
  page: number; // 0-based
  size: number;
  sort?: string; // e.g. "createdAt,desc"
  search?: string;
  role?: string;
  requestedRole?: string;
  approvalStatus?: string;
  enabled?: boolean;
  locked?: boolean;
};

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  getUserSummary(): Observable<AdminUserSummary> {
    return this.http.get<AdminUserSummary>(`${environment.apiBaseUrl}/api/admin/dashboard/user-summary`);
  }

  getUsersByRole(): Observable<AdminUsersByRoleResponse | Record<string, number>> {
    return this.http.get<AdminUsersByRoleResponse | Record<string, number>>(
      `${environment.apiBaseUrl}/api/admin/dashboard/users-by-role`
    );
  }

  getUsersByApprovalStatus(): Observable<AdminUsersByApprovalStatusResponse[]> {
    return this.http.get<AdminUsersByApprovalStatusResponse[]>(
      `${environment.apiBaseUrl}/api/admin/dashboard/users-by-approval-status`
    );
  }

  getUsersGrowth(months: number = 6): Observable<UserGrowthResponse> {
    const params = new HttpParams().set('months', String(months));
    return this.http.get<UserGrowthResponse>(
      `${environment.apiBaseUrl}/api/admin/dashboard/users-growth`,
      { params }
    );
  }

  getAccountRates(): Observable<AccountRatesResponse> {
    return this.http.get<AccountRatesResponse>(
      `${environment.apiBaseUrl}/api/admin/dashboard/account-rates`
    );
  }

  getUsers(query: AdminUsersQuery): Observable<AdminPage<AdminUserRow> | AdminUserRow[]> {
    let params = new HttpParams().set('page', query.page).set('size', query.size);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.search) params = params.set('search', query.search);
    if (query.role) params = params.set('role', query.role);
    if (query.requestedRole) params = params.set('requestedRole', query.requestedRole);
    if (query.approvalStatus) params = params.set('approvalStatus', query.approvalStatus);
    if (typeof query.enabled === 'boolean') params = params.set('enabled', String(query.enabled));
    if (typeof query.locked === 'boolean') params = params.set('locked', String(query.locked));

    return this.http.get<AdminPage<AdminUserRow> | AdminUserRow[]>(`${environment.apiBaseUrl}/api/admin/users`, {
      params
    });
  }

  getPendingRoleRequests(): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(`${environment.apiBaseUrl}/api/admin/users/pending-role-requests`);
  }

  approveRole(userId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/admin/users/${userId}/approve-role`, {});
  }

  rejectRole(userId: number): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/admin/users/${userId}/reject-role`, {});
  }

  /**
   * Admin-only: toggle an account's lock state.
   * PUT /api/users/{id} with { locked }.
   * Backend clears failedLoginAttempts when unlocking.
   */
  setUserLocked(userId: number, locked: boolean): Observable<AdminUserRow | unknown> {
    return this.http.put<AdminUserRow>(`${environment.apiBaseUrl}/api/users/${userId}`, { locked });
  }

  /**
   * Admin-only: GET /api/admin/users/{id}/devices
   * Returns the devices recorded for the given user, ordered by lastLoginAt DESC.
   */
  getUserDevices(userId: number): Observable<DeviceResponse[]> {
    return this.http
      .get<DeviceResponse[]>(`${environment.apiBaseUrl}/api/admin/users/${userId}/devices`)
      .pipe(map((res) => (Array.isArray(res) ? res : [])));
  }

  /* -------------------------------------------------------------- */
  /*  ADMIN NOTIFICATIONS                                           */
  /* -------------------------------------------------------------- */

  /**
   * GET /api/admin/notifications?page=&size=
   * Tolerant to two backend shapes: a Spring Page object or a plain array.
   * Always returns a normalized AdminNotification[].
   */
  getNotifications(page: number = 0, size: number = 10): Observable<AdminNotification[]> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http
      .get<AdminPage<AdminNotification> | AdminNotification[]>(
        `${environment.apiBaseUrl}/api/admin/notifications`,
        { params }
      )
      .pipe(
        map((res) => {
          const list = Array.isArray(res) ? res : res?.content ?? [];
          return list.map((n) => this.normalizeNotification(n));
        })
      );
  }

  /**
   * GET /api/admin/notifications/unread-count
   * Tolerant to a plain number, a `{ count }` object or a `{ unreadCount }` object.
   */
  getUnreadCount(): Observable<number> {
    return this.http
      .get<number | { count?: number; unreadCount?: number }>(
        `${environment.apiBaseUrl}/api/admin/notifications/unread-count`
      )
      .pipe(
        map((res) => {
          if (typeof res === 'number') return Math.max(0, Math.floor(res));
          if (res && typeof res === 'object') {
            const v = (res as { count?: number; unreadCount?: number }).count
              ?? (res as { count?: number; unreadCount?: number }).unreadCount;
            return typeof v === 'number' ? Math.max(0, Math.floor(v)) : 0;
          }
          return 0;
        })
      );
  }

  /** PUT /api/admin/notifications/{id}/read */
  markNotificationAsRead(id: number): Observable<unknown> {
    return this.http.put(`${environment.apiBaseUrl}/api/admin/notifications/${id}/read`, {});
  }

  /** PUT /api/admin/notifications/read-all */
  markAllNotificationsAsRead(): Observable<unknown> {
    return this.http.put(`${environment.apiBaseUrl}/api/admin/notifications/read-all`, {});
  }

  /** Normalize backend variations (`isRead`, `seen`, missing title, etc.). */
  private normalizeNotification(raw: unknown): AdminNotification {
    const r = (raw ?? {}) as Record<string, unknown>;
    const readVal = r['read'] ?? r['isRead'] ?? r['seen'] ?? false;
    return {
      id: Number(r['id'] ?? 0),
      title: typeof r['title'] === 'string' ? (r['title'] as string) : undefined,
      message: typeof r['message'] === 'string' ? (r['message'] as string) : '',
      type: typeof r['type'] === 'string' ? (r['type'] as string) : undefined,
      read: Boolean(readVal),
      createdAt:
        typeof r['createdAt'] === 'string'
          ? (r['createdAt'] as string)
          : typeof r['created_at'] === 'string'
            ? (r['created_at'] as string)
            : ''
    };
  }
}

