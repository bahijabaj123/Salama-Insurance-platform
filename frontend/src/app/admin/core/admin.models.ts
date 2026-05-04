export interface AdminUserSummary {
  totalUsers: number;
  pendingApprovals: number;
  rejectedRequests: number;
  lockedUsers: number;
  totalClients?: number;
  totalAssureurs?: number;
  totalExperts?: number;
}

export type AdminMetricPoint = {
  label: string;
  value: number;
};

export interface AdminUsersByRoleResponse {
  points: AdminMetricPoint[];
}

export interface AdminUsersByApprovalStatusResponse {
  label: string;
  count: number;
}

export interface AdminUserRow {
  id: number;
  email: string;
  fullName: string;
  role: string;
  requestedRole: string | null;
  approvalStatus: string;
  enabled: boolean;
  locked: boolean;
  createdAt: string;
}

export interface AdminPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-based page index
  size: number;
}

export interface MonthlyUserCount {
  /** ISO year-month, e.g. "2026-04". */
  period: string;
  count: number;
}

export interface UserGrowthResponse {
  currentMonth: MonthlyUserCount;
  previousMonth: MonthlyUserCount;
  /** Current month users as a percentage of the previous month. */
  currentVsPreviousPercent: number;
  /** Signed growth rate vs. previous month, e.g. -40 for a 40% drop. */
  growthRate: number;
  series: MonthlyUserCount[];
}

export interface AccountRatesResponse {
  /** 0..100 */
  activationRate: number;
  /** 0..100 */
  rejectionRate: number;
}

/**
 * Admin notification (returned by GET /api/admin/notifications).
 *
 * Backend field names are tolerated to be slightly different (e.g. `read`,
 * `isRead`, `seen`) — the frontend service normalizes them into this shape.
 */
export interface AdminNotification {
  id: number;
  /** Optional title (some events may only send a message). */
  title?: string;
  message: string;
  /** Backend event type; common values: NEW_USER_REGISTERED, ACCOUNT_LOCKED, etc. */
  type?: string;
  /** Whether this notification has been marked as read. */
  read: boolean;
  /** ISO-8601 creation timestamp from the server. */
  createdAt: string;
}

/** Response shape for GET /api/admin/notifications/unread-count. */
export interface UnreadCountResponse {
  count: number;
}

