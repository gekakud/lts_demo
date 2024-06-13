from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import asyncio

from connection_manager import ConnectionManager
from common import *

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # This should be more specific in a production environment
    allow_methods=["*"],
    allow_headers=["*"]
)

manager = ConnectionManager()
html = "./basic_client.html"

# Serve static files
app.mount("/client", StaticFiles(directory="client"), name="static")
app.mount("/dashboard", StaticFiles(directory="dashboard"), name="static")

html_file = os.path.join(os.path.dirname(__file__), "client", "basic_client.html")
@app.get("/")
async def get():
    with open(html_file, "r") as f:
        html = f.read()
    return HTMLResponse(html)

@app.get("/dashboard")
async def dashboard():
    html_file = os.path.join(os.path.dirname(__file__), "dashboard", "dashboard.html")
    with open(html_file, "r") as f:
        html_content = f.read()
    return HTMLResponse(html_content)

cnt = 0
import random
# @app.websocket("/ws/{client_id}")
# async def websocket_endpoint(websocket: WebSocket, client_id: int):
#     print(f"Client #{client_id} attempting to connect...")
#     await manager.connect(websocket)
#     try: 
#         while True:
#             data = await websocket.receive_text()
#             try:
#                 received_msg = Message.from_json(data) # Assuming data is sent as JSON
#             except JsonConvertException as e:
#                 await manager.send_personal_message(f"server::private::Error: {str(e)}", websocket)
#                 print(f"Error: {str(e)}")
#                 continue

#             if received_msg.type == "location":
#                 # Broadcast this updated message to all clients
#                 received_msg.latitude += random.uniform(-0.05, 0.05)
#                 received_msg.longitude += random.uniform(-0.05, 0.05)
#                 await manager.broadcast(received_msg.to_json(), websocket)
#                 latitude = received_msg.latitude
#                 longitude = received_msg.longitude

#                 print(f"Received location: {latitude}, {longitude} from client {received_msg.sender_id}")
#                 server_got_location_msg = Message(type=MessageType.SERVER_MESSAGE, content=f"Server got your location: {str(latitude)}, {str(longitude)}")
#                 await manager.send_personal_message(server_got_location_msg.to_json(), websocket)

#             elif received_msg.type == "client_message":
#                 # Send a private message to the client that sent the message
#                 print(f"Received message: {received_msg.content} from client {received_msg.sender_id}")

#                 server_got_msg = Message(type=MessageType.SERVER_MESSAGE, content=f"Server got your message: {received_msg.content}")
#                 await manager.send_personal_message(server_got_msg.to_json(), websocket)
                
#             else:
#                 # Handle other messages as before
#                 await manager.send_personal_message(f"server::private::Got your message: {received_msg.to_json()}", websocket)
#                 await manager.broadcast(f"server::public::Client #{client_id} posted message: {received_msg.to_json()}", websocket)
#     except WebSocketDisconnect:
#         manager.disconnect(websocket)
#         await manager.broadcast(f"Client #{client_id} has left", websocket)
#     except Exception as e:
#         manager.disconnect(websocket)
#         print('General exception ' + str(e))

@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    print("Attempting to connect dashboard...")
    try:
        await websocket.accept()
        print("Dashboard WebSocket connected")
        while True:
            # data = manager.get_all_clients_info()
            dummy_msg = Message(type=MessageType.SERVER_MESSAGE, content="This is a dummy message").to_json()
            await websocket.send_json(dummy_msg)
            await asyncio.sleep(3)  # Consider adjusting the frequency based on actual needs
    except WebSocketDisconnect:
        print("Dashboard WebSocket disconnected")
        await websocket.close()
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
