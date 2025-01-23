const mqtt = require('mqtt');
const WebSocket = require('ws');

// MQTT broker connection details
const brokerUrl = 'mqtt://5.196.78.28'; // Replace with your broker URL
const topics = ['sector1', 'sector2', 'sector3', 'sector4', 'sector5', 'sector6', 'sector7'];

// Connect to the MQTT broker
const client = mqtt.connect(brokerUrl);

// Set up WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server running on ws://localhost:8080');

// Store all connected WebSocket clients
const connectedClients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  connectedClients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    connectedClients.delete(ws);
  });
});

// Forward MQTT messages to WebSocket clients
client.on('connect', () => {
  console.log('Connected to MQTT broker');

  // Subscribe to all topics
  topics.forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to topic "${topic}":`, err.message);
      } else {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  });
});

client.on('message', (topic, message) => {
  try {
    const parsedMessage = JSON.parse(message.toString());

    if (parsedMessage.moisture && Array.isArray(parsedMessage.moisture)) {
      const { moisture } = parsedMessage;

      // Validate moisture array
      const isValid = moisture.every((value) => Number.isInteger(value) && value >= 0 && value <= 100);

      if (isValid) {
        console.log(`MQTT - Topic: ${topic}, Message:`, parsedMessage);

        // Prepare sector-specific message
        const sectorNumber = topic.replace('sector', '');
        const sectorMessage = {
          [`moisture${sectorNumber}`]: moisture,
        };

        const data = JSON.stringify({ topic, message: sectorMessage });

        // Broadcast to all connected WebSocket clients
        connectedClients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(data);
          }
        });
      } else {
        console.warn(`Invalid "moisture" values in topic "${topic}":`, parsedMessage);
      }
    } else {
      console.warn(`Invalid message format from topic "${topic}":`, message);
    }
  } catch (err) {
    console.error(`Failed to parse message from topic "${topic}":`, err.message);
  }
});

client.on('error', (err) => {
  console.error('MQTT client error:', err.message);
});
