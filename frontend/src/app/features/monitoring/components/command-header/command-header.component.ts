import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { WEBSOCKET_BACKEND_PORT } from '../../../../core/constants/websocket.constants';
import { CameraStateService } from '../../../../core/services/camera-state.service';
import { ClockService } from '../../../../core/services/clock.service';

@Component({
  selector: 'app-command-header',
  templateUrl: './command-header.component.html',
  styleUrl: './command-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandHeaderComponent {
  private readonly clockService = inject(ClockService);
  private readonly cameraState = inject(CameraStateService);

  readonly time = this.clockService.time;
  readonly onlineTotal = this.cameraState.onlineTotal;
  readonly totalCameras = this.cameraState.totalCameras;
  readonly backendPort = WEBSOCKET_BACKEND_PORT;
}
