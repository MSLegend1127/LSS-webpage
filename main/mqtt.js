const mqtt = require('mqtt');
const WebSocket = require('ws');

const broker = 'mqtt://5.196.78.28:1883';  // MQTT broker address
const totalSectors = 7;  // Number of sectors
const sensorsPerSector = 4;  // Sensors per sector

// Initialize variables a, b, c, d to store the moisture values
let a, b, c, d;

// Generate MQTT topics for each sector
const topics = [];
for (let i = 1; i <= totalSectors; i++) {
    topics.push(`sector${i}`);
}

const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server started on port 8080');

const mqttClient = mqtt.connect(broker);

// Function to handle MQTT message and update a, b, c, d
function handleMqttMessages(topic, message) {
    try {
        const data = JSON.parse(message.toString());

        // Extract sector from topic (e.g., "sector1")
        const sector = topic.split('/').pop();

        // Assuming the message contains a 'moisture' array with 4 values
        const moistureArray = data.moisture;
        const intArray = moistureArray.map(num => parseInt(num, 10));

        // Update the array values a, b, c, d
        a = intArray[0];
        b = intArray[1];
        c = intArray[2];
        d = intArray[3];

        console.log(` ${topic}: a=${a}, b=${b}, c=${c}, d=${d}`);

        // Broadcast the updated values to all WebSocket clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                const updatedData = { a, b, c, d };
                client.send(JSON.stringify(updatedData));
            }
        });

    } catch (error) {
        console.error('Error parsing message:', error);
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

// Listen for incoming MQTT messages and pass them to the handler function
mqttClient.on('message', handleMqttMessages);

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Send initial values (a, b, c, d) to the client
    const initialData = { a, b, c, d };
    ws.send(JSON.stringify(initialData));

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});
