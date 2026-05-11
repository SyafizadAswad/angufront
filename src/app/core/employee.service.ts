import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Employee, EmployeeRequest } from './employee.model';

/**
 * Maps to `EmployeesController`: string `employeeNumber` route keys, `/api/employees`.
 */
@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly resource = `${environment.apiBaseUrl}/employees`;

  getAll(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.resource);
  }

  getByEmployeeNumber(employeeNumber: string): Observable<Employee> {
    const key = encodeURIComponent(employeeNumber);
    return this.http.get<Employee>(`${this.resource}/${key}`);
  }

  create(body: EmployeeRequest): Observable<Employee> {
    return this.http.post<Employee>(this.resource, body);
  }

  update(employeeNumber: string, body: EmployeeRequest): Observable<void> {
    const key = encodeURIComponent(employeeNumber);
    return this.http.put<void>(`${this.resource}/${key}`, body);
  }

  delete(employeeNumber: string): Observable<void> {
    const key = encodeURIComponent(employeeNumber);
    return this.http.delete<void>(`${this.resource}/${key}`);
  }
}
