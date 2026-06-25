import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CameraGridComponent } from './components/camera-grid/camera-grid.component';
import { CommandHeaderComponent } from './components/command-header/command-header.component';
import { MonitoringFooterComponent } from './components/monitoring-footer/monitoring-footer.component';
import { MonitoringToolbarComponent } from './components/monitoring-toolbar/monitoring-toolbar.component';
import { StatusSummaryComponent } from './components/status-summary/status-summary.component';

@Component({
  selector: 'app-monitoring-page',
  imports: [
    CommandHeaderComponent,
    StatusSummaryComponent,
    MonitoringToolbarComponent,
    CameraGridComponent,
    MonitoringFooterComponent,
  ],
  templateUrl: './monitoring.page.html',
  styleUrl: './monitoring.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringPage {}
