import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WEBSOCKET_BACKEND_PORT } from '../../../../core/constants/websocket.constants';
import { CameraStateService } from '../../../../core/services/camera-state.service';

@Component({
  selector: 'app-monitoring-footer',
  templateUrl: './monitoring-footer.component.html',
  styleUrl: './monitoring-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringFooterComponent {
  private readonly cameraState = inject(CameraStateService);

  readonly onlineTotal = this.cameraState.onlineTotal;
  readonly offlineTotal = this.cameraState.offlineTotal;
  readonly backendPort = WEBSOCKET_BACKEND_PORT;
}
