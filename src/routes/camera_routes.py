from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from w_sockets.RTSP import RTSP_Protocol

router: APIRouter = APIRouter()
rtsp_protocol = RTSP_Protocol()

# WebSocket endpoint para streaming de vídeo
@router.websocket("/ws/camera/{camera_id}")
async def camera_stream(websocket: WebSocket, camera_id: str):
    await rtsp_protocol.connect(websocket, camera_id)
    try:
        while True:
            await websocket.receive_text()  # Mantém a conexão aberta
    except WebSocketDisconnect:
        rtsp_protocol.disconnect(websocket, camera_id)

