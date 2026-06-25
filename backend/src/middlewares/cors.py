from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

def configure_cors(app: FastAPI, allow_origins: list[str] | None = None) -> None:
    # Permite todas as origens por padrão, mas pode ser configurado para permitir apenas origens específicas
    if allow_origins is None:
        allow_origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
