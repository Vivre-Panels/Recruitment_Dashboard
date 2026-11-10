import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div class="mb-7 text-center">
          <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">T</div>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900">Sign in to TalentOps</h1>
          <p class="mt-2 text-sm text-slate-500">Access your recruitment dashboard securely.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label for="email" class="mb-1.5 block text-xs font-bold text-slate-700">Email</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" required class="app-input w-full" placeholder="you@company.com" />
          </div>
          <div>
            <label for="password" class="mb-1.5 block text-xs font-bold text-slate-700">Password</label>
            <input id="password" type="password" formControlName="password" autocomplete="current-password" required class="app-input w-full" placeholder="Your password" />
          </div>

          <div *ngIf="errorMessage" role="alert" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-800">{{ errorMessage }}</div>
          <button type="submit" [disabled]="form.invalid || isSubmitting" class="flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
            {{ isSubmitting ? 'Please wait…' : 'Sign in' }}
          </button>
        </form>

      </section>
    </main>
  `
})
export class AuthPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  isSubmitting = false;
  errorMessage = '';
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required]]
  });

  submit() {
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: response => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const fallback = response.user.role === 'superadmin' ? '/dashboard/overview' : '/dashboard/application-insights';
        const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : fallback;
        void this.router.navigateByUrl(destination);
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'Could not sign in. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
