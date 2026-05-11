import { Component, OnInit, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Employee, EmployeeRequest } from '../../core/employee.model';
import { EmployeeService } from '../../core/employee.service';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeesApi = inject(EmployeeService);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  private editingEmployeeNumber: string | null = null;

  readonly form = this.fb.group({
    employeeNumber: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(7)],
    }),
    employeeName: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    joinDate: this.fb.control(this.todayIsoDate(), { validators: [Validators.required] }),
    departmentId: this.fb.control(0, { validators: [Validators.required] }),
    mailAddress: this.fb.control('', { validators: [Validators.email] }),
  });

  get isEdit(): boolean {
    return this.editingEmployeeNumber !== null;
  }

  ngOnInit(): void {
    const employeeNumber = this.route.snapshot.paramMap.get('employeeNumber');
    if (employeeNumber) {
      this.editingEmployeeNumber = employeeNumber;
      this.form.controls.employeeNumber.disable();
      this.employeesApi.getByEmployeeNumber(employeeNumber).subscribe({
        next: (emp) => this.patchFromEmployee(emp),
        error: (err: unknown) => this.error.set(this.describeError(err)),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    const body: EmployeeRequest = {
      employeeNumber: v.employeeNumber,
      employeeName: v.employeeName,
      joinDate: v.joinDate,
      departmentId: Number(v.departmentId),
      mailAddress: v.mailAddress ?? '',
    };

    if (this.editingEmployeeNumber === null) {
      this.employeesApi.create(body).subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigate(['/employees']);
        },
        error: (err: unknown) => this.fail(err),
      });
    } else {
      this.employeesApi.update(this.editingEmployeeNumber, body).subscribe({
        next: () => {
          this.saving.set(false);
          void this.router.navigate(['/employees']);
        },
        error: (err: unknown) => this.fail(err),
      });
    }
  }

  cancel(): void {
    void this.router.navigate(['/employees']);
  }

  private patchFromEmployee(emp: Employee): void {
    const join =
      emp.joinDate && emp.joinDate.length >= 10 ? emp.joinDate.slice(0, 10) : this.todayIsoDate();
    this.form.patchValue({
      employeeNumber: emp.employeeNumber,
      employeeName: emp.employeeName,
      joinDate: join,
      departmentId: emp.departmentId,
      mailAddress: emp.mailAddress ?? '',
    });
  }

  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private fail(err: unknown): void {
    this.saving.set(false);
    this.error.set(this.describeError(err));
  }

  private describeError(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message?: string }).message ?? err);
    }
    return 'Could not save. Check API URL and payload shape vs your DTO.';
  }
}
