import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DashboardUser {
	uid: number;
	email: string;
	role: 'superadmin' | 'recruiter';
	rid?: number;
	recruiter_name?: string;
	exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;
  private sessionRequest?: Observable<DashboardUser | null>;
  readonly user = signal<DashboardUser | null>(null);

  ensureSession(): Observable<DashboardUser | null> {
    if (this.user()) return of(this.user());
    if (this.sessionRequest) return this.sessionRequest;
    this.sessionRequest = this.http.get<{ success: boolean; user: DashboardUser }>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      map(response => response.success ? response.user : null),
      tap(user => this.user.set(user)),
      catchError(() => { this.user.set(null); return of(null); }),
      finalize(() => this.sessionRequest = undefined),
      shareReplay(1)
    );
    return this.sessionRequest;
  }

  login(email: string, password: string) {
    return this.authenticate('login', email, password);
  }

  private authenticate(endpoint: string, email: string, password: string) {
    return this.http.post<{ success: boolean; user: DashboardUser }>(`${this.apiUrl}/${endpoint}`, { email, password }, { withCredentials: true }).pipe(
      tap(response => this.user.set(response.user))
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      catchError(() => of(null)),
      finalize(() => {
        this.user.set(null);
        void this.router.navigateByUrl('/login');
      })
    ).subscribe();
  }
}
