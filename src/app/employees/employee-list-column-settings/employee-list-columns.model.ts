export type EmployeeListColumnKey = 'name' | 'email' | 'joined' | 'department';

export interface EmployeeListColumnDef {
  key: EmployeeListColumnKey;
  label: string;
}

export const EMPLOYEE_LIST_COLUMNS: EmployeeListColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'joined', label: 'Joined' },
  { key: 'department', label: 'Department' },
];

export type EmployeeListColumnVisibility = Record<EmployeeListColumnKey, boolean>;

export function defaultColumnVisibility(): EmployeeListColumnVisibility {
  return {
    name: true,
    email: true,
    joined: true,
    department: true,
  };
}

export function countVisibleColumns(visibility: EmployeeListColumnVisibility): number {
  return EMPLOYEE_LIST_COLUMNS.filter((c) => visibility[c.key]).length;
}
