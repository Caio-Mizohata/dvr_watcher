import asyncio
import logging
import threading
from fastapi import WebSocket

from services.camera_service import CameraService
from config.conection import get_urls_config

logger = logging.getLogger(__name__)

class RTSP_Protocol:
    def __init__(self):
        self.conexoes_ativas: dict[str, set[WebSocket]] = {}
        self.stream_threads: dict[str, threading.Thread] = {}
        self.loops: dict[str, asyncio.AbstractEventLoop] = {}
        self.stop_events: dict[str, threading.Event] = {}

    async def connect(self, websocket: WebSocket, camera_id: str) -> bool:
        await websocket.accept()
        
        # Garante que existe um conjunto de conexões para esta câmera
        if camera_id not in self.conexoes_ativas:
            self.conexoes_ativas[camera_id] = set()
        
        self.conexoes_ativas[camera_id].add(websocket)
        
        # Se for o primeiro cliente desta câmera, inicia a thread
        if len(self.conexoes_ativas[camera_id]) == 1:
            self.loops[camera_id] = asyncio.get_running_loop()
            self.stop_events[camera_id] = threading.Event()
            
            rtsp_url = get_urls_config().get(camera_id)
            if not rtsp_url:
                logger.error(f"RTSP URL inválida ou canal não configurado para camera_id={camera_id}")
                await websocket.close(code=1008)
                self.conexoes_ativas[camera_id].discard(websocket)
                if not self.conexoes_ativas[camera_id]:
                    self.conexoes_ativas.pop(camera_id, None)
                return False
            
            camera_service = CameraService(camera_id, rtsp_url)
            
            # Inicia o serviço passando as referências de rede para ele
            thread = threading.Thread(
                target=camera_service.start_capture, 
                args=(
                    self.conexoes_ativas[camera_id], 
                    self.loops[camera_id], 
                    self.stop_events[camera_id],
                    self.disconnect  # Passa a função para o serviço poder desconectar clientes que caírem
                ), 
                daemon=True
            )
            self.stream_threads[camera_id] = thread
            thread.start()

        return True

    def disconnect(self, websocket: WebSocket, camera_id: str):
        if camera_id in self.conexoes_ativas:
            self.conexoes_ativas[camera_id].discard(websocket)
            
            # Se não houver mais clientes, encerra a thread
            if not self.conexoes_ativas[camera_id]:
                if camera_id in self.stop_events:
                    self.stop_events[camera_id].set()
                
                # Limpa os recursos associados a esta câmera
                self.conexoes_ativas.pop(camera_id, None)
                self.stream_threads.pop(camera_id, None)
                self.stop_events.pop(camera_id, None)
                self.loops.pop(camera_id, None)
