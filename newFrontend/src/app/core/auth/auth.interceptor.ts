import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiUrl)) return next(request);
  const router = inject(Router);
  return next(request.clone({ withCredentials: true })).pipe(catchError(error => {
    const isEmployeeDirectoryRequest = request.url.includes('/employees');
    if (error?.status === 401 && !request.url.includes('/auth/') && !isEmployeeDirectoryRequest) {
      void router.navigateByUrl('/login');
    }
    return throwError(() => error);
  }));
};
