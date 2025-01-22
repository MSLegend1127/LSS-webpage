const WebSocket = require('ws');
const mqtt = require('mqtt');

const broker = 'mqtt://5.196.78.28:1883';  // MQTT broker address
const totalSectors = 7;  // Number of sectors

// Generate MQTT topics for each sector
const topics = [];
for (let i = 1; i <= totalSectors; i++) {
    topics.push(`sector${i}`);
}
console.log('MQTT Topics:', topics);

// Create the WebSocket server correctly
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server started on port 8080');-

let mqttClient = mqtt.connect(broker);

// Sample initial moisture data
let moistureArray = [0, 0, 0, 0];  // Default values

// Function to handle incoming MQTT messages
function handleMqttMessages(topic, message) {
    try {
        const data = JSON.parse(message.toString());

        // Assuming the message contains a 'moisture' array with 4 values
        moistureArray = data.moisture || moistureArray;  // Update moisture array if present

        console.log('Updated Moisture Data:', moistureArray);

        // Broadcast the updated moisture values to all WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ moisture: moistureArray }));
            }
        });
    } catch (error) {
        console.error('Error parsing MQTT message:', error);
    }
}

// MQTT client connection and subscription
mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker!');
    mqttClient.subscribe(topics, (err) => {
        if (err) {
            console.error('Subscription error:', err);
        } else {
            console.log('Subscribed to topics:', topics.join(', '));
        }
    });
});

// Listen for incoming MQTT messages
mqttClient.on('message', handleMqttMessages);

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial moisture data
    ws.send(JSON.stringify({ moisture: moistureArray }));

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// Handle server errors
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});