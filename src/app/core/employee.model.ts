/**
 * Mirrors `EmployeesAPI.Model.EmployeeResponse` (JSON uses camelCase by default).
 * `deparmentName` matches the property name on the server DTO (typo preserved).
 */
export interface Employee {
  employeeNumber: string;
  employeeName: string;
  joinDate: string;
  departmentId: number;
  deparmentName: string | null;
  mailAddress: string | null;
  joinDateDisplay?: string;
}

/** Mirrors `EmployeesAPI.Model.EmployeeRequest` for POST/PUT bodies. */
export interface EmployeeRequest {
  employeeNumber: string;
  employeeName: string;
  joinDate: string;
  departmentId: number;
  mailAddress: string;
}

export type EmployeeCreate = EmployeeRequest;
