import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Employee, EmployeeRequest } from '../../core/employee.model';
import { EmployeeService } from '../../core/employee.service';
import { GaugeComponent } from '../../gauge-test/gauge-test.component';
import { getApiErrorMessage } from '../../core/api-error-message';
import { EmployeeListColumnSettingsComponent } from '../employee-list-column-settings/employee-list-column-settings.component';
import {
  EmployeeListColumnKey,
  EmployeeListColumnVisibility,
  defaultColumnVisibility,
  countVisibleColumns,
} from '../employee-list-column-settings/employee-list-columns.model';

export type EmployeeSortKey =
  | 'number-asc'
  | 'number-desc'
  | 'name-az'
  | 'join-asc'
  | 'join-desc'
  | 'department-az';

@Component({
  selector: 'app-employee-list',
  imports: [RouterLink, ReactiveFormsModule, GaugeComponent, EmployeeListColumnSettingsComponent],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.scss',
})
export class EmployeeListComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
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

  readonly sortKey = signal<EmployeeSortKey>('number-asc');

  /** Employee number of the row currently in inline edit mode. */
  readonly editingEmployeeNumber = signal<string | null>(null);
  readonly savingEdit = signal(false);
  readonly editRowError = signal<string | null>(null);
  /** Which row’s actions dropdown is open (`employeeNumber`), or `null`. */
  readonly openActionsMenu = signal<string | null>(null);

  readonly columnsModalOpen = signal(false);
  readonly columnVisibility = signal(defaultColumnVisibility());

  readonly tableColumnCount = computed(
    () => countVisibleColumns(this.columnVisibility()) + 1,
  );

  /** Data columns only — drives table width / layout classes. */
  readonly visibleDataColumnCount = computed(() => countVisibleColumns(this.columnVisibility()));

  readonly editForm = this.fb.group({
    employeeName: this.fb.control('', {
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    joinDate: this.fb.control('', { validators: [Validators.required] }),
    departmentId: this.fb.control(0, { validators: [Validators.required] }),
    mailAddress: this.fb.control('', { validators: [Validators.email] }),
  });

  readonly sortedEmployees = computed(() => {
    const rows = [...this.employees()];
    const key = this.sortKey();
    const cmpNum = (a: Employee, b: Employee) =>
      a.employeeNumber.localeCompare(b.employeeNumber, undefined, { numeric: true });
    const joinSort = (a: Employee, b: Employee) => {
      const sa = (a.joinDate ?? '').slice(0, 10);
      const sb = (b.joinDate ?? '').slice(0, 10);
      return sa.localeCompare(sb);
    };
    const dept = (a: Employee, b: Employee) =>
      (a.deparmentName ?? '').localeCompare(b.deparmentName ?? '', undefined, {
        sensitivity: 'base',
      });

    switch (key) {
      case 'number-asc':
        rows.sort(cmpNum);
        break;
      case 'number-desc':
        rows.sort((a, b) => cmpNum(b, a));
        break;
      case 'name-az':
        rows.sort((a, b) =>
          a.employeeName.localeCompare(b.employeeName, undefined, { sensitivity: 'base' }),
        );
        break;
      case 'join-asc':
        rows.sort(joinSort);
        break;
      case 'join-desc':
        rows.sort((a, b) => joinSort(b, a));
        break;
      case 'department-az':
        rows.sort(dept);
        break;
    }
    return rows;
  });

  onSortChange(event: Event): void {
    const el = event.target as HTMLSelectElement | null;
    const v = el?.value as EmployeeSortKey | undefined;
    if (
      v === 'number-asc' ||
      v === 'number-desc' ||
      v === 'name-az' ||
      v === 'join-asc' ||
      v === 'join-desc' ||
      v === 'department-az'
    ) {
      this.sortKey.set(v);
    }
  }

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

  /** Heuristic: only show the hover “full name” bubble when the label is likely truncated or very long. */
  showNameHoverTip(name: string): boolean {
    return name.trim().length >= 22;
  }

  isColumnVisible(key: EmployeeListColumnKey): boolean {
    return this.columnVisibility()[key];
  }

  openColumnsModal(): void {
    this.columnsModalOpen.set(true);
  }

  closeColumnsModal(): void {
    this.columnsModalOpen.set(false);
  }

  onColumnVisibilityChange(next: EmployeeListColumnVisibility): void {
    this.columnVisibility.set(next);
  }

  isEditing(emp: Employee): boolean {
    return this.editingEmployeeNumber() === emp.employeeNumber;
  }

  canStartEdit(): boolean {
    return this.editingEmployeeNumber() === null && !this.savingEdit();
  }

  isActionsMenuOpen(emp: Employee): boolean {
    return this.openActionsMenu() === emp.employeeNumber;
  }

  toggleActionsMenu(employeeNumber: string, event: Event): void {
    event.stopPropagation();
    if (!this.canStartEdit()) {
      return;
    }
    this.openActionsMenu.set(
      this.openActionsMenu() === employeeNumber ? null : employeeNumber,
    );
  }

  closeActionsMenu(): void {
    this.openActionsMenu.set(null);
  }

  onMenuEdit(emp: Employee): void {
    this.closeActionsMenu();
    this.startEdit(emp);
  }

  onMenuDelete(emp: Employee): void {
    this.closeActionsMenu();
    this.remove(emp);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeActionsMenu();
  }

  startEdit(emp: Employee): void {
    if (!this.canStartEdit()) {
      return;
    }
    this.editRowError.set(null);
    this.editingEmployeeNumber.set(emp.employeeNumber);
    const join =
      emp.joinDate && emp.joinDate.length >= 10 ? emp.joinDate.slice(0, 10) : this.todayIsoDate();
    this.editForm.reset({
      employeeName: emp.employeeName,
      joinDate: join,
      departmentId: emp.departmentId,
      mailAddress: emp.mailAddress ?? '',
    });
  }

  cancelEdit(): void {
    if (this.savingEdit()) {
      return;
    }
    this.closeActionsMenu();
    this.editingEmployeeNumber.set(null);
    this.editRowError.set(null);
    this.editForm.reset({
      employeeName: '',
      joinDate: this.todayIsoDate(),
      departmentId: 0,
      mailAddress: '',
    });
  }

  saveEdit(employeeNumber: string): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const v = this.editForm.getRawValue();
    const body: EmployeeRequest = {
      employeeNumber,
      employeeName: v.employeeName,
      joinDate: v.joinDate,
      departmentId: Number(v.departmentId),
      mailAddress: v.mailAddress ?? '',
    };

    this.savingEdit.set(true);
    this.editRowError.set(null);
    this.employeesApi.update(employeeNumber, body).subscribe({
      next: () => {
        this.savingEdit.set(false);
        this.editingEmployeeNumber.set(null);
        this.load();
      },
      error: (err: unknown) => {
        this.savingEdit.set(false);
        this.editRowError.set(
          getApiErrorMessage(err, 'Could not save changes. Check API URL and payload shape.'),
        );
      },
    });
  }

  load(): void {
    this.cancelEdit();
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
        this.error.set(
          getApiErrorMessage(err, 'Request failed. Check API URL, CORS, and that the backend is running.'),
        );
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
        this.error.set(
          getApiErrorMessage(err, 'Request failed. Check API URL, CORS, and that the backend is running.'),
        );
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
    if (this.isEditing(emp)) {
      return;
    }
    if (!confirm(`Delete ${emp.employeeName} (${emp.employeeNumber})?`)) {
      return;
    }
    this.employeesApi.delete(emp.employeeNumber).subscribe({
      next: () => this.load(),
      error: (err: unknown) =>
        this.error.set(
          getApiErrorMessage(err, 'Request failed. Check API URL, CORS, and that the backend is running.'),
        ),
    });
  }

  private todayIsoDate(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
