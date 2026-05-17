import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { authGuard, guestGuard } from './core/auth.guard';
import { EmployeeFormComponent } from './employees/employee-form/employee-form.component';
import { EmployeeListComponent } from './employees/employee-list/employee-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'employees' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: 'employees',
    component: EmployeeListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'employees/new',
    component: EmployeeFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'employees/:employeeNumber/edit',
    component: EmployeeFormComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'employees' },
];
