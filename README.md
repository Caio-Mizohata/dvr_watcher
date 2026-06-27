# DVR Watcher

Aplicação de monitoramento de câmeras em tempo real para redes locais.

## Funcionalidades

- Streaming RTSP de cameras/DVR para o navegador.
- Backend FastAPI com endpoint WebSocket por camera.
- Captura de video com OpenCV em thread dedicada por canal ativo.
- Broadcast do mesmo stream para multiplos clientes conectados.
- Frontend Angular com dashboard CCTV responsivo.
- Cards com status, FPS, ultimo frame recebido e modo de foco.
- Reconnect com backoff e keepalive no WebSocket.
- Configuracao de cameras por variaveis de ambiente.

## Stack

**Backend**

- Python 3.11+ ou superior
- FastAPI
- Uvicorn
- OpenCV headless
- WebSockets
- python-dotenv

**Frontend**

- Angular 21
- TypeScript
- RxJS
- Signals
- Vitest

## Como funciona

1. O frontend conecta em `ws://localhost:8000/ws/camera/{camera_id}`.
2. O backend valida o `camera_id` contra as cameras configuradas no `.env`.
3. Para a primeira conexao de uma camera, o backend inicia uma thread de captura RTSP.
4. O OpenCV le frames do DVR, redimensiona para `640x480` e codifica em JPEG.
5. Os bytes JPEG sao enviados pelo WebSocket para todos os clientes daquela camera.
6. O frontend recebe os blobs, cria bitmaps e desenha os frames em um `<canvas>`.
7. Quando nao ha mais clientes para uma camera, a captura e encerrada.

## Estrutura

```text
.
|-- backend/
|   |-- requirements.txt
|   |-- .env.example
|   `-- src/
|       |-- app.py
|       |-- config/
|       |-- middlewares/
|       |-- routes/
|       |-- services/
|       `-- w_sockets/
`-- frontend/
    |-- package.json
    `-- src/app/
        |-- core/
        `-- features/monitoring/
```

## Pré-requisitos

- Python 3.11+ ou superior
- Node.js compativel com Angular 21
- npm ou yarn
- DVR/camera com acesso RTSP na rede local
- Credenciais de acesso ao DVR

## Configuração do backend

Entre na pasta do backend e crie o arquivo de ambiente a partir do exemplo de `.env.example`:

Edite em `backend/.env` com as credenciais do seu DVR:

```env
user=seu_usuario
password=sua_senha
ip_address=seu_ip (ex: 192.168.0.100)
channel_1=1
channel_2=2
```

As variaveis `channel_1` e `channel_2` definem os IDs que o frontend deve usar ao conectar no WebSocket. Com a configuracao acima, os endpoints serao:

```text
ws://localhost:8000/ws/camera/1
ws://localhost:8000/ws/camera/2
...
```

> Você pode adicionar quantos canais quiser, basta criar novas variaveis `channel_N` no `.env` e atualizar o frontend com os mesmos IDs.

---

### A URL RTSP atual é montada em `backend/src/config/conection.py` no formato

```text
rtsp://usuario:senha@ip_do_dvr:554/cam/realmonitor?channel={channel}&subtype=0
```

## Se o seu DVR usa outro padrão de RTSP, altere esse arquivo para o formato exigido pelo fabricante

### Atualmente o projeto foi testado com os seguintes DVRs

| Fabricante | Modelo | URL RTSP |
|------------|--------|-----------|
| Intelbras | MHDX-1116 | rtsp://usuario:senha@ip_do_dvr:554/cam/realmonitor?channel={channel}&subtype=0 |
| ICSee | X6-WEQ | rtsp://usuario:senha@ip_do_dvr:554/12/ |

## Rodando o backend

Linux/macOS:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd src
python3 app.py
```

Windows PowerShell:

```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd src
python3 app.py
```

O backend ficará disponivel em:

```text
http://127.0.0.1:8000
```

## Rodando o frontend

Em outro terminal, rode o frontend.

Linux/macOS:

```bash
cd frontend
npm install
npm start
```

Windows PowerShell:

```powershell
cd frontend
npm install
npm start
```

Acesse:

```text
http://localhost:4200
```

Por padrao, o frontend procura o backend WebSocket na porta `8000`, definida em:

```text
frontend/src/app/core/constants/websocket.constants.ts
```

## Configurando cameras no frontend

As cameras exibidas no dashboard ficam em:

```text
frontend/src/app/core/constants/camera.constants.ts
```

Exemplo:

```ts
export const DEFAULT_CAMERAS = [
  {
    id: '1',
    label: 'Camera 01',
    // Altere para o nome do local da camera
    zone: 'Entrada principal',
    streamEnabled: true,
  },
];
```

O `id` precisa bater com o canal configurado no backend. Se `streamEnabled` estiver como `false`, o card aparece como canal inativo e nao tenta abrir o WebSocket.

## Endpoint WebSocket

```text
GET /ws/camera/{camera_id}
```

Exemplo:

```text
ws://localhost:8000/ws/camera/1
```

O backend envia frames JPEG em mensagens binarias. O cliente mantem a conexao viva enviando mensagens `ping` periodicamente.
