import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';

import { Employee, EmployeeRequest } from '../../core/employee.model';
import { EmployeeService } from '../../core/employee.service';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeesApi = inject(EmployeeService);

  readonly saving = signal(false);
  readonly removing = signal(false);
  readonly error = signal<string | null>(null);
  /** Set from the route in edit mode; `null` means create (new employee). */
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

  /** React to `/employees/new` ↔ `/employees/:id/edit` on the same component: `paramMap` emits on every route param change. */
  constructor() {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(),
        switchMap((params) => {
          const employeeNumber = params.get('employeeNumber');
          if (!employeeNumber) {
            this.resetToCreate();
            return of(undefined);
          }
          this.editingEmployeeNumber = employeeNumber;
          this.form.controls.employeeNumber.disable();
          this.error.set(null);
          return this.employeesApi.getByEmployeeNumber(employeeNumber).pipe(
            tap((emp) => this.patchFromEmployee(emp)),
            map(() => undefined),
            catchError((err: unknown) => {
              this.error.set(this.describeError(err));
              return of(undefined);
            }),
          );
        }),
      )
      .subscribe();
  }

  /** True when the route includes `:employeeNumber` (edit existing employee). */
  get isEdit(): boolean {
    return this.editingEmployeeNumber !== null;
  }

  /** Save: create (POST) when not editing, update (PUT) when `editingEmployeeNumber` is set; then go to list. */
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

  /** Leave the form without saving; return to employee list. */
  cancel(): void {
    void this.router.navigate(['/employees']);
  }

  /** Edit only: delete this employee, then return to the list. */
  remove(): void {
    const num = this.editingEmployeeNumber;
    if (!num) {
      return;
    }
    if (!confirm(`Delete employee ${num}? This cannot be undone.`)) {
      return;
    }
    this.removing.set(true);
    this.error.set(null);
    this.employeesApi.delete(num).subscribe({
      next: () => {
        this.removing.set(false);
        void this.router.navigate(['/employees']);
      },
      error: (err: unknown) => {
        this.removing.set(false);
        this.fail(err);
      },
    });
  }

  /** New-employee route: clear edit state and reset the form (also used when switching away from an edit URL). */
  private resetToCreate(): void {
    this.editingEmployeeNumber = null;
    this.form.controls.employeeNumber.enable();
    this.form.reset({
      employeeNumber: '',
      employeeName: '',
      joinDate: this.todayIsoDate(),
      departmentId: 0,
      mailAddress: '',
    });
    this.error.set(null);
  }

  /** Edit flow: fill the form after `getByEmployeeNumber` succeeds. */
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

  /** Default `joinDate` for new rows and fallback when the API date is missing/short. */
  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /** Shared error path for create/update HTTP failures. */
  private fail(err: unknown): void {
    this.saving.set(false);
    this.error.set(this.describeError(err));
  }

  /** Turn API/unknown errors into a short message for `error` signal. */
  private describeError(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message?: string }).message ?? err);
    }
    return 'Could not save. Check API URL and payload shape vs your DTO.';
  }
}
