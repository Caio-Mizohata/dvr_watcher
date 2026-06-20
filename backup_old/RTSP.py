import asyncio
import threading
import cv2
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import dotenv
import os

dotenv.load_dotenv()

# Mapeamento de IDs para suas respectivas URLs RTSP
CAMERA_URLS: dict[str, str] = {
    "1": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_1')}&subtype=0",
    "2": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_2')}&subtype=0",
    # "3": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_3')}&subtype=0",
    # "4": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_4')}&subtype=0",
}

class ConnectionManager:
    def __init__(self):
        # Gerenciamento dinâmico por ID de câmera
        self.active_connections: dict[str, set[WebSocket]] = {}
        self.loops: dict[str, asyncio.AbstractEventLoop] = {}
        self.stream_threads: dict[str, threading.Thread] = {}
        self.stop_events: dict[str, threading.Event] = {}

    async def connect(self, websocket: WebSocket, camera_id: str):
        await websocket.accept()
        
        if camera_id not in self.active_connections:
            self.active_connections[camera_id] = set()
            
        self.active_connections[camera_id].add(websocket)
        
        # Se for o primeiro cliente desta câmera, inicia a thread de captura
        if len(self.active_connections[camera_id]) == 1:
            self.loops[camera_id] = asyncio.get_running_loop()
            self.stop_events[camera_id] = threading.Event()
            
            thread = threading.Thread(
                target=self._capture_loop, 
                args=(camera_id,), 
                daemon=True
            )
            self.stream_threads[camera_id] = thread
            thread.start()

    def disconnect(self, websocket: WebSocket, camera_id: str):
        if camera_id in self.active_connections:
            self.active_connections[camera_id].discard(websocket)
            
            # Se não houver mais clientes nesta câmera, encerra a thread e limpa os recursos
            if not self.active_connections[camera_id]:
                if camera_id in self.stop_events:
                    self.stop_events[camera_id].set()
                
                self.active_connections.pop(camera_id, None)
                self.stream_threads.pop(camera_id, None)
                self.stop_events.pop(camera_id, None)
                self.loops.pop(camera_id, None)

    async def broadcast(self, data: bytes, camera_id: str):
        if camera_id in self.active_connections:
            for connection in list(self.active_connections[camera_id]):
                try:
                    await connection.send_bytes(data)
                except Exception:
                    self.disconnect(connection, camera_id)

    def _capture_loop(self, camera_id: str):
        url = CAMERA_URLS.get(camera_id)
        if not url:
            return

        cap = cv2.VideoCapture(url)
        if not cap.isOpened():
            print(f"Erro ao abrir o stream da câmera {camera_id}")
            return

        stop_event = self.stop_events.get(camera_id)
        while stop_event and not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                print(f"Falha ao ler o frame da câmera {camera_id}")
                break
            
            frame = cv2.resize(frame, (640, 480))
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            data = buffer.tobytes()
            
            loop = self.loops.get(camera_id)
            conns = self.active_connections.get(camera_id)
            if loop and conns:
                asyncio.run_coroutine_threadsafe(self.broadcast(data, camera_id), loop)

        cap.release()

manager: ConnectionManager = ConnectionManager()
app: FastAPI = FastAPI()

@app.websocket("/ws/rtsp/{camera_id}")
async def websocket_endpoint(websocket: WebSocket, camera_id: str):
    if camera_id not in CAMERA_URLS:
        await websocket.close(code=1008)
        return
        
    await manager.connect(websocket, camera_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, camera_id)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
    