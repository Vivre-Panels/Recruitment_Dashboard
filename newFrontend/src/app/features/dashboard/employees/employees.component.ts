import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

interface EmployeeAccount {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'recruiter';
  is_active: boolean;
  recruiter_status: string;
  created_at: string;
}

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
    <div class="app-page-container !h-full !min-h-0 !p-2 -mt-3 !max-w-7xl">
      <app-page-header [compact]="true" title="Employees" subtitle="Dashboard accounts and their access status."></app-page-header>

      <section class="app-card mt-5 flex flex-1 min-h-0 flex-col overflow-hidden !p-0">
        <div class="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Employee Accounts</h2>
            <p class="mt-1 text-xs text-slate-500">{{ filteredEmployees().length }} accounts</p>
          </div>
          <input
            type="search"
            [value]="searchTerm()"
            (input)="searchTerm.set($any($event.target).value)"
            placeholder="Search name or email..."
            aria-label="Search employees"
            class="app-input w-full sm:w-72"
          />
        </div>

        <div class="border-b border-slate-200 bg-slate-50/70 px-4 py-4">
          <button *ngIf="!createFormOpen()" type="button" (click)="createFormOpen.set(true)" class="app-btn-primary text-xs">Create superadmin</button>
          <form *ngIf="createFormOpen()" (ngSubmit)="createSuperadmin()" class="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <div>
              <label for="new-admin-email" class="mb-1 block text-[11px] font-bold text-slate-600">Admin email</label>
              <input id="new-admin-email" name="email" type="email" required maxlength="255" [(ngModel)]="newAdminEmail" placeholder="admin@company.com" class="app-input w-full" />
            </div>
            <div>
              <label for="new-admin-password" class="mb-1 block text-[11px] font-bold text-slate-600">Temporary password</label>
              <input id="new-admin-password" name="password" type="password" required minlength="6" maxlength="12" [(ngModel)]="newAdminPassword" placeholder="6–12 characters" class="app-input w-full" />
            </div>
            <button type="submit" [disabled]="creatingAdmin() || newAdminPassword.length < 6 || newAdminPassword.length > 12" class="app-btn-primary text-xs disabled:opacity-50">{{ creatingAdmin() ? 'Creating…' : 'Create account' }}</button>
            <button type="button" (click)="closeCreateForm()" class="app-btn-secondary text-xs">Cancel</button>
          </form>
          <p *ngIf="createMessage()" class="mt-3 text-xs font-semibold" [ngClass]="createError() ? 'text-red-700' : 'text-emerald-700'">{{ createMessage() }}</p>
        </div>

        <div *ngIf="loading()" class="px-4 py-12 text-center text-sm text-slate-500">Loading employee accounts...</div>
        <div *ngIf="!loading() && error()" class="px-4 py-12 text-center">
          <p class="text-sm font-semibold text-red-700">{{ error() }}</p>
          <button type="button" (click)="loadEmployees()" class="mt-3 text-xs font-bold text-brand-700 underline">Try again</button>
        </div>
        <div *ngIf="!loading() && !error() && filteredEmployees().length === 0" class="px-4 py-12 text-center text-sm text-slate-500">
          {{ employees().length ? 'No employees match your search.' : 'No dashboard accounts found.' }}
        </div>

        <div *ngIf="!loading() && !error() && filteredEmployees().length > 0" class="min-h-0 flex-1 overflow-auto">
          <table class="w-full min-w-[760px] text-left text-xs">
            <thead class="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="px-4 py-3">Employee</th>
                <th class="px-3 py-3">Email</th>
                <th class="px-3 py-3">Role</th>
                <th class="px-3 py-3">Account</th>
                <th class="px-3 py-3">Recruiter Status</th>
                <th class="px-3 py-3">Created</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let employee of filteredEmployees()" class="hover:bg-slate-50/70">
                <td class="px-4 py-3 font-semibold text-slate-900">{{ employee.name }}</td>
                <td class="px-3 py-3 text-slate-600">{{ employee.email }}</td>
                <td class="px-3 py-3">
                  <span class="rounded-full px-2 py-1 text-[10px] font-bold" [ngClass]="employee.role === 'superadmin' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'">
                    {{ employee.role === 'superadmin' ? 'Superadmin' : 'Recruiter' }}
                  </span>
                </td>
                <td class="px-3 py-3">
                  <span class="font-semibold" [ngClass]="employee.is_active ? 'text-emerald-700' : 'text-slate-500'">{{ employee.is_active ? 'Active' : 'Inactive' }}</span>
                </td>
                <td class="px-3 py-3 text-slate-600">{{ employee.recruiter_status }}</td>
                <td class="whitespace-nowrap px-3 py-3 text-slate-500">{{ employee.created_at ? (employee.created_at | date:'dd MMM yyyy') : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `
})
export class EmployeesComponent implements OnInit {
  private http = inject(HttpClient);
  readonly employees = signal<EmployeeAccount[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly searchTerm = signal('');
  readonly createFormOpen = signal(false);
  readonly creatingAdmin = signal(false);
  readonly createMessage = signal('');
  readonly createError = signal(false);
  newAdminEmail = '';
  newAdminPassword = '';

  ngOnInit(): void {
    this.loadEmployees();
  }

  filteredEmployees(): EmployeeAccount[] {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    if (!term) return this.employees();
    return this.employees().filter(employee =>
      employee.name.toLocaleLowerCase().includes(term) || employee.email.toLocaleLowerCase().includes(term)
    );
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<{ success: boolean; data: EmployeeAccount[] }>(`${environment.apiUrl}/employees`, { withCredentials: true }).subscribe({
      next: response => {
        this.employees.set(response.data || []);
        this.loading.set(false);
      },
      error: error => {
        this.error.set(error?.status === 401
          ? 'The Employees API rejected this session (401). Please sign in again, then retry.'
          : error?.status === 403
            ? 'Only a superadmin can view employee accounts.'
            : 'Could not load employee accounts.');
        this.loading.set(false);
      }
    });
  }

  closeCreateForm(): void {
    this.createFormOpen.set(false);
    this.createMessage.set('');
    this.newAdminEmail = '';
    this.newAdminPassword = '';
  }

  createSuperadmin(): void {
    if (this.creatingAdmin() || this.newAdminPassword.length < 6 || this.newAdminPassword.length > 12) return;
    this.creatingAdmin.set(true);
    this.createMessage.set('');
    this.http.post<{ success: boolean; data: { email: string } }>(
      `${environment.apiUrl}/employees/superadmin`,
      { email: this.newAdminEmail.trim(), password: this.newAdminPassword },
      { withCredentials: true }
    ).subscribe({
      next: response => {
        this.createError.set(false);
        this.createMessage.set(`Superadmin account created for ${response.data.email}.`);
        this.newAdminEmail = '';
        this.newAdminPassword = '';
        this.creatingAdmin.set(false);
        this.loadEmployees();
      },
      error: error => {
        this.createError.set(true);
        this.createMessage.set(error?.error?.message || 'Could not create superadmin account.');
        this.creatingAdmin.set(false);
      }
    });
  }
}
