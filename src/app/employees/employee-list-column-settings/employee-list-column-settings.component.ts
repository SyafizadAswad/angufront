import { Component, HostListener, input, output } from '@angular/core';

import {
  EMPLOYEE_LIST_COLUMNS,
  EmployeeListColumnKey,
  EmployeeListColumnVisibility,
  countVisibleColumns,
} from './employee-list-columns.model';

@Component({
  selector: 'app-employee-list-column-settings',
  templateUrl: './employee-list-column-settings.component.html',
  styleUrl: './employee-list-column-settings.component.scss',
})
export class EmployeeListColumnSettingsComponent {
  readonly open = input(false);
  readonly visibility = input.required<EmployeeListColumnVisibility>();

  readonly visibilityChange = output<EmployeeListColumnVisibility>();
  readonly closed = output<void>();

  readonly columns = EMPLOYEE_LIST_COLUMNS;

  isColumnChecked(key: EmployeeListColumnKey): boolean {
    return this.visibility()[key];
  }

  canUncheck(key: EmployeeListColumnKey): boolean {
    if (!this.visibility()[key]) {
      return true;
    }
    return countVisibleColumns(this.visibility()) > 1;
  }

  onToggle(key: EmployeeListColumnKey, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (!checked && !this.canUncheck(key)) {
      (event.target as HTMLInputElement).checked = true;
      return;
    }
    this.visibilityChange.emit({ ...this.visibility(), [key]: checked });
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }
}
