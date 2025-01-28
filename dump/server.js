// MQTT and WebSocket libraries
const WebSocket = require('ws');
const mqtt = require('mqtt');

// MQTT broker URL and subscription topic
const mqttBroker = 'mqtt://5.196.78.28:1883'; // Broker IP address
const subscriber = ''; // MQTT topic for subscription

// Create MQTT client
const client = mqtt.connect(mqttBroker);

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    // Handle received MQTT messages and update the values
    client.on('message', (topic, message) => {
        const msg = message.toString();
        console.log(`Received message: "${msg}" from topic: "${topic}"`);

        try {
            const json_message = JSON.parse(msg);
            const moistureArray = json_message.moisture;
            const intArray = moistureArray.map(num => parseInt(num, 10));
            console.log('Converted moisture values:', intArray);

            // Send updated moisture values to the WebSocket client
            ws.send(JSON.stringify({
                a: intArray[0],
                b: intArray[1],
                c: intArray[2],
                d: intArray[3]
            }));
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // WebSocket client disconnection handling
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// MQTT client connection and subscription
client.on('connect', () => {
    console.log('Connected to MQTT broker!');
    client.subscribe(subscriber, (err) => {
        if (err) {
            console.error('Subscription error:', err);
        } else {
            console.log(`Subscribed to topic: ${subscriber}`);
        }
    });
});

// MQTT error handling
client.on('error', (err) => {
    console.error('MQTT error:', err);
});

// Publish MQTT message with sector data and motor state
function publishMQTT(sectorId, payload) {
    const topic = `sector${sectorId}`;
    const message = JSON.stringify(payload);

    client.publish(topic, message, (err) => {
        if (err) {
            console.error(`Error publishing to ${topic}:`, err);
        } else {
            console.log(`Data sent to ${topic}`);
        }
    });
}

// Update progress bars and labels for moisture data
function updateProgressBar(sectorId, moistureData) {
    // Update individual sensor progress bars and labels
    for (let i = 1; i <= 4; i++) {
        const sensorBar = document.querySelector(`#sector${sectorId}-sensor${i}`);
        if (sensorBar) {
            const moistureValue = moistureData[i - 1];
            sensorBar.style.width = `${moistureValue}%`;
            sensorBar.textContent = `${moistureValue.toFixed(1)}%`;
        }
    }

    // Calculate and update the average moisture level
    const avg = moistureData.reduce((a, b) => a + b, 0) / moistureData.length;
    const avgBar = document.querySelector(`#sector${sectorId}-avg`);
    const avgLabel = document.querySelector(`#sector${sectorId}-avg-label`);

    if (avgBar && avgLabel) {
        avgBar.style.width = `${avg}%`;
        avgLabel.textContent = `Avg: ${avg.toFixed(1)}%`;
    }
}

// Simulate real-time sensor data (remove if using actual sensor data)
setInterval(() => {
    const sector1Data = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];
    updateProgressBar(1, sector1Data);
}, 3000);

// Toggle motor state and update UI
function toggleState(sectorId) {
    const toggle = document.getElementById(`toggle${sectorId}`);
    const isOn = toggle.classList.toggle('on');
    const state = isOn ? 1 : 0;

    // Simulate sensor data (replace with actual sensor readings)
    const moistureData = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];

    // Create payload to send via MQTT
    const payload = {
        moisture: moistureData,
        motor: state
    };

    // Publish data to MQTT broker
    publishMQTT(sectorId, payload);

    // Update label text based on motor state
    const label = toggle.previousElementSibling;
    label.textContent = `Sprinkler ${sectorId}: ${state === 1 ? "ON" : "OFF"}`;

    // Update progress bars with new moisture data
    updateProgressBar(sectorId, moistureData);
}
