const mqtt = require('mqtt');
const WebSocket = require('ws');

// MQTT broker connection details
const brokerUrl = 'mqtt://5.196.78.28'; // Replace with your broker URL
const topics = ['sector1', 'sector2', 'sector3', 'sector4', 'sector5', 'sector6', 'sector7'];

// Connect to the MQTT broker
const client = mqtt.connect(brokerUrl);

// Set up WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server started on port 8080');

const mqttClient = mqtt.connect(broker);

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
