import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

function isApiRequest(url: string): boolean {
  const base = environment.apiBaseUrl;
  return url.startsWith(base) || url.startsWith('/api');
}

function isAuthLoginRequest(url: string): boolean {
  return url.includes(environment.authLoginPath) || url.includes('/auth/login');
}

/** Attaches `Authorization: Bearer` to API calls; logs out on 401 (except login). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  let outgoing = req;
  const token = auth.getToken();
  if (token && isApiRequest(req.url) && !isAuthLoginRequest(req.url)) {
    outgoing = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        isApiRequest(req.url) &&
        !isAuthLoginRequest(req.url)
      ) {
        auth.logout(false);
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
