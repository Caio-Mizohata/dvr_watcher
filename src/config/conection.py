from dotenv import load_dotenv
import os

load_dotenv()

# Adicione as URLs das câmeras ao dicionário usando as variáveis de ambiente se houver mais cameras
URLS_CONFIG: dict[str, str] = {
    "1": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_1')}&subtype=0",
    "2": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_2')}&subtype=0",
    # "3": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_3')}&subtype=0",
    # "4": f"rtsp://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('ip_address')}:554/cam/realmonitor?channel={os.getenv('channel_4')}&subtype=0",
}


def get_urls_config() -> dict[str, str]:
    # Retorna o dicionário de URLs de câmeras, que pode ser usado em outros módulos
    return URLS_CONFIG