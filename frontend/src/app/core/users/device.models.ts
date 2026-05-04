/**
 * Shape returned by GET /api/users/me/devices.
 * The backend returns the current user's devices ordered by lastLoginAt DESC.
 *
 * Notes (kept in sync with the backend contract):
 * - There is NO current-session marker.
 * - There is NO delete/revoke endpoint.
 * - OAuth2 logins currently do NOT create device rows, so users who only
 *   logged in with Google/GitHub may receive an empty list.
 */
export interface DeviceResponse {
  id: number;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  /** ISO-8601 timestamp from the backend. */
  createdAt: string;
  /** ISO-8601 timestamp from the backend. */
  lastLoginAt: string;
}
