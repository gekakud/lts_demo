import json
from dataclasses import dataclass, asdict

class ConnectionStatus:
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"

class MessageType:
    LOCATION = "location"
    MESSAGE = "client_message"
    SERVER_MESSAGE = "server_message"
    CONNECTION_STATUS = "connection_status"

class JsonConvertException(Exception):
    """Exception raised for errors in the serialization or deserialization process."""
    def __init__(self, message="Cannot serialize or deserialize the object"):
        self.message = message
        super().__init__(self.message)


@dataclass
class Message:
    type: str = None
    content: str = None
    status: str = None
    sender_id: int = None
    latitude: float = None
    longitude: float = None

    def to_json(self):
        # Convert the dataclass to a dictionary including all fields
        try:
            return json.dumps(asdict(self))
        except Exception as e:
            raise JsonConvertException(f'Cannot serialize the object: {str(e)}')

    @staticmethod
    def from_json(json_data):
        try:
            data = json.loads(json_data)
            return Message(**data)
        except Exception as e:
            raise JsonConvertException(f'Cannot deserialize the object: {str(e)}')
        