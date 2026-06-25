from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.src.w_sockets.RTSP import RTSP_Protocol

router: APIRouter = APIRouter()
rtsp_protocol = RTSP_Protocol()

# WebSocket endpoint para streaming de vídeo
@router.websocket("/ws/camera/{camera_id}")
async def camera_stream(websocket: WebSocket, camera_id: str):
    connected = await rtsp_protocol.connect(websocket, camera_id)
    if not connected:
        return

    try:
        while True:
            await websocket.receive_text()  # Mantém a conexão aberta
    except (WebSocketDisconnect, RuntimeError):
        rtsp_protocol.disconnect(websocket, camera_id)

