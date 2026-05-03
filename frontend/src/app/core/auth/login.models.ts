/** Request body for POST /api/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** User object returned on successful login */
export interface LoggedUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  requestedRole: string | null;
  approvalStatus: string;
  enabled: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

/** HTTP 200 success body */
export interface LoginResponse {
  token: string;
  type: string;
  user: LoggedUser;
}

/** Parsed JSON error bodies from auth endpoints */
export interface LoginApiErrorBody {
  status?: number;
  error?: string;
  message?: string;
  timestamp?: string;
  errors?: Record<string, string>;
}
