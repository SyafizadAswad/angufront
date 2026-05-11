import { Routes } from '@angular/router';

import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'employees' },
  { path: 'employees', component: EmployeeListComponent },
  { path: 'employees/new', component: EmployeeFormComponent },
  { path: 'employees/:employeeNumber/edit', component: EmployeeFormComponent },
  { path: '**', redirectTo: 'employees' },
];
