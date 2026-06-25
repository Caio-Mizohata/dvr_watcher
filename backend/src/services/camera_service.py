import cv2
import logging
import threading
import asyncio
from typing import Callable
from fastapi import WebSocket

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self, camera_id: str, rtsp_url: str):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.cap = None

    async def broadcast(self, data: bytes, conexoes: set[WebSocket], on_disconnect: Callable):
        """Método interno para enviar os frames para os websockets."""
        # Itera sobre uma cópia da lista de conexões
        for connection in list(conexoes):
            try:
                await connection.send_bytes(data)
            except Exception:
                # Se a conexão cair no meio do envio, avisa o Protocolo para removê-la
                on_disconnect(connection, self.camera_id)

    def start_capture(self, conexoes: set[WebSocket], loop: asyncio.AbstractEventLoop, stop_event: threading.Event, on_disconnect: Callable):
        """Inicia a captura e faz o broadcast direto do serviço."""
        if not self.rtsp_url:
            logger.error(f"URL RTSP inválida para a câmera {self.camera_id}: {self.rtsp_url!r}")
            return
        
        # Tenta abrir a câmera usando OpenCV
        self.cap = cv2.VideoCapture(self.rtsp_url)
        
        if not self.cap.isOpened():
            logger.error(f"Não foi possível abrir a câmera {self.camera_id} com URL {self.rtsp_url}")
            return

        logger.info(f"Captura iniciada para câmera {self.camera_id}")

        # Loop de captura e broadcast
        while not stop_event.is_set():
            ret, frame = self.cap.read()
            if not ret:
                logger.warning(f"Falha ao ler frame da câmera {self.camera_id}")
                break
            
            # Processamento da imagem
            frame = cv2.resize(frame, (640, 480))
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            data = buffer.tobytes()
            
            # Dispara o broadcast assíncrono dentro da thread do asyncio
            if loop and not loop.is_closed() and conexoes:
                asyncio.run_coroutine_threadsafe(
                    self.broadcast(data, conexoes, on_disconnect), 
                    loop
                )

        if self.cap:
            self.cap.release()
        logger.info(f"Captura encerrada para câmera {self.camera_id}")
        