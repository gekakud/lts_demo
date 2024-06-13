from fastapi import FastAPI, WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
    
    async def broadcast(self, message: str, websocket_to_exclude:WebSocket):
        for connection in self.active_connections:
            if connection is websocket_to_exclude:
                continue
            await connection.send_text(message)

    async def get_all_clients_info(self):
        return [{"client_id": id(ws), "last_message": ws.last_message} for ws in self.active_connections]