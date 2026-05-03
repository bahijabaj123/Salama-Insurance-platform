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

