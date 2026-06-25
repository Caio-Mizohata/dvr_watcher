import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/monitoring/monitoring.page').then((module) => module.MonitoringPage),
  },
];
