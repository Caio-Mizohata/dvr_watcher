import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WEBSOCKET_BACKEND_PORT, WEBSOCKET_CAMERA_PATH, WEBSOCKET_KEEPALIVE_INTERVAL_MS } from '../constants/websocket.constants';

export class CameraStreamError extends Error {
  constructor(message: string, readonly code: number, readonly wasOpened: boolean, readonly receivedFrame: boolean) {
    super(message);
    this.name = 'CameraStreamError';
  }
}

@Injectable({ providedIn: 'root' })
export class CameraStreamService {
  private readonly document = inject(DOCUMENT);

  connect(cameraId: string): Observable<Blob> {
    return new Observable<Blob>((subscriber) => {
      const socket = new WebSocket(this.buildCameraUrl(cameraId));
      socket.binaryType = 'blob';
      let keepAliveIntervalId: number | null = null;
      let wasOpened = false;
      let receivedFrame = false;

      socket.onopen = () => {
        wasOpened = true;
        keepAliveIntervalId = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          }
        }, WEBSOCKET_KEEPALIVE_INTERVAL_MS);
      };

      socket.onmessage = (event: MessageEvent<Blob>) => {
        if (event.data instanceof Blob) {
          receivedFrame = true;
          subscriber.next(event.data);
        }
      };

      socket.onerror = () => {
        if (!subscriber.closed) {
          subscriber.error(
            new CameraStreamError(`WebSocket error for camera ${cameraId}`, 1006, wasOpened, receivedFrame),
          );
        }
      };

      socket.onclose = (event) => {
        if (subscriber.closed) {
          return;
        }

        if (receivedFrame && event.wasClean) {
          subscriber.complete();
          return;
        }

        subscriber.error(new CameraStreamError(`WebSocket closed for camera ${cameraId}`,
            event.code,
            wasOpened,
            receivedFrame,
          ),
        );
      };

      return () => {
        if (keepAliveIntervalId !== null) {
          window.clearInterval(keepAliveIntervalId);
        }

        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      };
    });
  }

  private buildCameraUrl(cameraId: string): string {
    const { hostname, protocol } = this.document.location;
    const websocketProtocol = protocol === 'https:' ? 'wss:' : 'ws:';

    return `${websocketProtocol}//${hostname}:${WEBSOCKET_BACKEND_PORT}${WEBSOCKET_CAMERA_PATH}/${cameraId}`;
  }
}
