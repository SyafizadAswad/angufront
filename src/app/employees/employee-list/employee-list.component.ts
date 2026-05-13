import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Employee } from '../../core/employee.model';
import { EmployeeService } from '../../core/employee.service';

@Component({
  selector: 'app-employee-list',
  imports: [RouterLink],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  private readonly employeesApi = inject(EmployeeService);
  private readonly destroyRef = inject(DestroyRef);

  /** When `true`, `pageshow` came from the back/forward cache — reload so the table is not stale. */
  private readonly onPageShow = (event: PageTransitionEvent): void => {
    if (event.persisted) {
      this.load();
    }
  };

  readonly employees = signal<Employee[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  /** True when the table shows a single row from `getByEmployeeNumber`. */
  readonly searchActive = signal(false);
  readonly notFoundError = signal(false);

  /** Bound from the search box; not a signal so template binding stays simple. */
  employeeNumberSearch = '';

  onSearchInput(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    this.employeeNumberSearch = el?.value ?? '';
  }

  ngOnInit(): void {
    this.load();
    window.addEventListener('pageshow', this.onPageShow);
    this.destroyRef.onDestroy(() => window.removeEventListener('pageshow', this.onPageShow));
  }

  joinDateLabel(emp: Employee): string {
    if (emp.joinDateDisplay) {
      return emp.joinDateDisplay;
    }
    const d = emp.joinDate;
    if (d && d.length >= 10) {
      return d.slice(0, 10);
    }
    return d || '—';
  }

  load(): void {
    this.searchActive.set(false);
    this.notFoundError.set(false);
    this.loading.set(true);
    this.error.set(null);
    this.employeesApi.getAll().subscribe({
      next: (rows) => {
        this.employees.set(rows);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.describeError(err));
        this.loading.set(false);
      },
    });
  }

  searchByEmployeeNumber(): void {
    const q = this.employeeNumberSearch.trim();
    this.notFoundError.set(false);
    if (!q) {
      this.load();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.employeesApi.getByEmployeeNumber(q).subscribe({
      next: (emp) => {
        this.employees.set([emp]);
        this.searchActive.set(true);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const status = this.httpStatus(err);
        if (status === 404) {
          this.notFoundError.set(true);
          this.error.set('No employee found with that number.');
          this.employees.set([]);
          this.searchActive.set(false);
          return;
        }
        this.error.set(this.describeError(err));
        this.searchActive.set(false);
      },
    });
  }

  clearSearch(): void {
    this.employeeNumberSearch = '';
    this.searchActive.set(false);
    this.notFoundError.set(false);
    this.error.set(null);
    this.load();
  }

  private httpStatus(err: unknown): number {
    if (err && typeof err === 'object' && 'status' in err) {
      const s = (err as { status?: number }).status;
      return typeof s === 'number' ? s : 0;
    }
    return 0;
  }

  remove(emp: Employee): void {
    if (!confirm(`Delete ${emp.employeeName} (${emp.employeeNumber})?`)) {
      return;
    }
    this.employeesApi.delete(emp.employeeNumber).subscribe({
      next: () => this.load(),
      error: (err: unknown) => this.error.set(this.describeError(err)),
    });
  }

  private describeError(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message?: string }).message ?? err);
    }
    return 'Request failed. Check API URL, CORS, and that the backend is running.';
  }
}
