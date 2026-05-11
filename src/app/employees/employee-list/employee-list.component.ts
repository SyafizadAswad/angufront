import { Component, OnInit, inject, signal } from '@angular/core';
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

  readonly employees = signal<Employee[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
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
