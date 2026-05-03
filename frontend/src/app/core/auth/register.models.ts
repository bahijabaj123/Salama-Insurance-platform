/** Request body for POST /api/auth/register */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'CLIENT' | 'ASSUREUR' | 'EXPERT';
}

/** HTTP 201 success body */
export interface RegisterSuccessResponse {
  message: string;
}

/** Common fields on error JSON bodies from this API */
export interface RegisterErrorBody {
  status?: number;
  error?: string;
  message?: string;
  timestamp?: string;
  /** Field-level validation messages (camelCase keys) */
  errors?: Record<string, string>;
}
