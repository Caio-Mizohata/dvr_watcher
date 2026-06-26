import { CameraDefinition } from '../models/camera.model';

export const CAMERA_CANVAS_WIDTH = 640;
export const CAMERA_CANVAS_HEIGHT = 360;

export const DEFAULT_CAMERAS: readonly CameraDefinition[] = [
  {
    id: '1',
    label: 'Camera 01',
    zone: 'Entrada principal',
    streamEnabled: true,
  },
  {
    id: '2',
    label: 'Camera 02',
    zone: 'Recepcao',
    streamEnabled: true,
  },
  {
    id: '3',
    label: 'Camera 03',
    zone: 'Patio externo',
    streamEnabled: false,
  },
  {
    id: '4',
    label: 'Camera 04',
    zone: 'Corredor tecnico',
    streamEnabled: false,
  },
];
