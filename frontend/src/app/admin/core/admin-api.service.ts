import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  AdminPage,
  AdminUserRow,
  AdminUserSummary,
  AdminUsersByApprovalStatusResponse,
  AdminUsersByRoleResponse
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
}

