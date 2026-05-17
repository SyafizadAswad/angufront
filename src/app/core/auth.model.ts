/** Request body for `POST {apiBaseUrl}/auth/login` (adjust property names if your API differs). */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Common JWT login response shapes from ASP.NET templates.
 * `extractAccessToken` picks the first non-empty token field.
 */
export interface LoginResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  expiresIn?: number;
  expires_in?: number;
}

export function extractAccessToken(res: LoginResponse): string | null {
  const candidates = [res.token, res.accessToken, res.access_token];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      return c.trim();
    }
  }
  return null;
}
