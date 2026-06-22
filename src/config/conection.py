from dotenv import load_dotenv
import os

load_dotenv()

def get_urls_config() -> dict[str, str]:
    # Abaixo, lê as variáveis de ambiente necessárias para construir as URLs RTSP
    user = os.getenv("USER")
    password = os.getenv("PASSWORD")
    ip_address = os.getenv("IP_ADDRESS")

    if not all([user, password, ip_address]):
        raise ValueError("Configuração de câmera incompleta: USER, PASSWORD e IP_ADDRESS são obrigatórios.")

    # Lê os canais configurados e monta as URLs correspondentes
    urls: dict[str, str] = dict()
    for i in range(1, 3):  # Suporta até 2 canais por enquanto, podendo ser expandido facilmente
        channel_key = f"CHANNEL_{i}"
        channel = os.getenv(channel_key)
        if not channel:
            continue  # Se o canal não estiver configurado, pula para o próximo
        if channel:
            urls[channel] = f"rtsp://{user}:{password}@{ip_address}:554/cam/realmonitor?channel={channel}&subtype=0"
    
    return urls

