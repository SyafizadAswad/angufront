import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  extractAccessToken,
} from './auth.model';

const TOKEN_STORAGE_KEY = 'auth_access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly loginUrl = `${environment.apiBaseUrl}${environment.authLoginPath}`;

  /** Mirrors whether a token is stored (updated on login / logout / 401). */
  readonly isAuthenticated = signal(this.hasStoredToken());

  login(credentials: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>(this.loginUrl, credentials).pipe(
      tap((res) => {
        const token = extractAccessToken(res);
        if (!token) {
          throw new Error('Login succeeded but the API did not return a token.');
        }
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        this.isAuthenticated.set(true);
      }),
      map(() => undefined),
    );
  }

  logout(navigateToLogin = true): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.isAuthenticated.set(false);
    if (navigateToLogin) {
      void this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private hasStoredToken(): boolean {
    const t = localStorage.getItem(TOKEN_STORAGE_KEY);
    return typeof t === 'string' && t.length > 0;
  }
}
