var ws = new WebSocket("ws://localhost:8000/ws/dashboard");

ws.onmessage = function(event) {
    var clients = JSON.parse(event.data);
    var list = document.getElementById('clientsInfo');
    list.innerHTML = '';  // Clear existing list

    clients.forEach(client => {
        var item = document.createElement('li');
        item.textContent = `Client ${client.client_id}: Last message - ${client.last_message}`;
        list.appendChild(item);
    });
};

ws.onerror = function(event) {
    console.error('WebSocket error observed:', event);
};