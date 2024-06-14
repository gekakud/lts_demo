mapboxgl.accessToken = 'pk.eyJ1IjoiZ2VrYXBlayIsImEiOiJjbHd4bXg2YzAxMmN2MmxwZ21ueDEwODJrIn0.C72XuFYJr6I_ZGS4Cp_JYg';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9 // starting zoom
});

var client_id = Date.now()
document.querySelector("#ws-id").textContent = client_id;
var ws = new WebSocket(`wss://lts-demo.onrender.com/ws/${client_id}`);

// Initialize marker at default position
var self_location_marker = new mapboxgl.Marker();

// Variables to store previous coordinates
var prevLat = 0;
var prevLong = 0;


// Initialize a dictionary to hold client IDs and their locations
var clientLocations = {};

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getColorFromId(clientId) {
    let hash = 0;
    const clientIdStr = clientId.toString();
    for (let i = 0; i < clientIdStr.length; i++) {
        hash = 31 * hash + clientIdStr.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    const shortHash = hash % 16777215; // Reduce to 'ffffff', the maximum hex value
    return '#' + shortHash.toString(16).padStart(6, '0');
}


// Function to update or add client location
function updateClientLocation(clientId, latitude, longitude) {
    clientLocations[clientId] = { latitude, longitude };
    if (!clientColors[clientId]) {
        clientColors[clientId] = getColorFromId(clientId); // Assign a new color if the client does not have one
    }
    updateMapMarkers();
}

// Function to remove a client from the dictionary
function removeClientLocation(clientId) {
    delete clientLocations[clientId];
    updateMapMarkers();
}

var mapMarkers = {};
var clientColors = {};    // Holds colors for each client

function updateMapMarkers() {
    // Update or create new markers for each client
    for (const clientId in clientLocations) {
        const location = clientLocations[clientId];
        const color = clientColors[clientId];
        if (mapMarkers[clientId]) {
            // Update existing marker position
            mapMarkers[clientId].setLngLat([location.longitude, location.latitude]);
        } else {
            // Create a new marker if it doesn't exist
            // mapMarkers[clientId] = new mapboxgl.Marker()
            //     .setLngLat([location.longitude, location.latitude])
            //     .addTo(map);
            const el = document.createElement('div');
            el.className = 'marker';
            el.style.backgroundColor = color;
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.borderRadius = '50%';

            mapMarkers[clientId] = new mapboxgl.Marker(el)
                .setLngLat([location.longitude, location.latitude])
                .addTo(map);
        }
    }

    // Remove markers for clients no longer tracked
    for (const clientId in mapMarkers) {
        if (!clientLocations[clientId]) {
            mapMarkers[clientId].remove(); // Remove the marker from the map
            delete mapMarkers[clientId];   // Delete the marker reference
        }
    }
};

function sendLocationToServer() {
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        var newLat = position.coords.latitude;
        var newLong = position.coords.longitude;

        // Check if the location has changed
        if (newLat !== prevLat || newLong !== prevLong) {
            var coords = [newLong, newLat];
            // Update the map center and marker position only if there is a change
            map.setCenter(coords);
            self_location_marker.setLngLat(coords).addTo(map);
        }
        // Send updated location to the server
        ws.send(JSON.stringify({
            type: 'location',
            sender_id: client_id,
            latitude: newLat,
            longitude: newLong,
            content: client_id + ' Location update'
        }));
    }, function(error) {
        console.error('Geolocation error:', error);
    });
} else {
    console.error('Geolocation is not supported by this browser.');
}};

function sendMessageToServer(event) {
    var input = document.getElementById("messageText");
    ws.send(JSON.stringify({
        type: 'client_message',
        sender_id: client_id,
        content: input.value
    }));
    input.value = '';
    event.preventDefault();
};

// Send location immediately and then every 5 seconds
sendLocationToServer();
setInterval(sendLocationToServer, 3000);

ws.onmessage = function(event) {
    // Parse the JSON string into an object
    var dataObject = JSON.parse(event.data);

    // Access properties from the parsed object
    var messages = document.getElementById('messages');
    var message = document.createElement('li');
    var contentText = dataObject.content || 'No message content'; // Assuming 'content' is a property of the received JSON
    var content = document.createTextNode(contentText);

    message.appendChild(content);
    messages.prepend(message); // Adds the new message to the top of the list

    // Example of additional handling based on other properties
    if (dataObject.type === 'location') {
        console.log(dataObject.sender_id, ' client. Location update received:', dataObject.latitude, dataObject.longitude);
        updateClientLocation(dataObject.sender_id, dataObject.latitude, dataObject.longitude);
    } else if (dataObject.type === 'client_message') {
        console.log('Message from client:', dataObject.sender_id, contentText);
    } else if (dataObject.type === 'server_message') {
        console.log('Message from server:', dataObject.sender_id, contentText);
    }
    
};
