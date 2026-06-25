import uvicorn
from fastapi import FastAPI

from middlewares.cors import configure_cors
from routes.camera_routes import router as camera_router

# Configuração do aplicativo FastAPI
app = FastAPI()
configure_cors(app)
app.include_router(camera_router)

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8000)
