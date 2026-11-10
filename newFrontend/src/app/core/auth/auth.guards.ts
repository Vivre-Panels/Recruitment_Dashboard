import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await firstValueFrom(auth.ensureSession());
  return user ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const roleGuard: CanActivateChildFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user() || await firstValueFrom(auth.ensureSession());
  if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  const allowedRoles = (route.data['roles'] as string[] | undefined) || ['superadmin'];
  if (allowedRoles.includes(user.role)) return true;
  if (user.role === 'recruiter') return router.createUrlTree(['/dashboard/application-insights']);
  return router.createUrlTree(['/dashboard/overview']);
};
