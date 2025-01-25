const mqtt = require('mqtt');
const WebSocket = require('ws');

// MQTT broker connection details
const brokerUrl = 'mqtt://5.196.78.28'; // Replace with your broker URL
const topics = ['sector1', 'sector2', 'sector3', 'sector4', 'sector5', 'sector6', 'sector7'];

// Connect to the MQTT broker
const mqttClient = mqtt.connect(brokerUrl);

// Set up WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });
console.log('WebSocket server started on port 8080');

// Handle MQTT connection
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker!');
  
  // Subscribe to all sector topics
  mqttClient.subscribe(topics, (err) => {
    if (err) {
      console.error('Subscription error:', err);
    } else {
      console.log('Subscribed to topics:', topics.join(', '));
    }
  });
});

// Debugging MQTT connection errors
mqttClient.on('error', (err) => {
  console.error('MQTT client error:', err.message);
});

// Handle incoming MQTT messages
mqttClient.on('message', (topic, message) => {
  try {
    const messageString = message.toString();
    let parsedMessage;

    try {
      // Try to parse the message as JSON
      parsedMessage = JSON.parse(messageString);
    } catch (err) {
      // If parsing fails, log a warning and treat the message as a raw string
      console.warn(`Received non-JSON message from topic "${topic}":`, messageString);
      parsedMessage = { rawMessage: messageString };
    }

    // Process JSON or raw string messages
    if (parsedMessage.moisture && Array.isArray(parsedMessage.moisture)) {
      const { moisture } = parsedMessage;

      // Validate moisture array
      const isValid = moisture.every((value) => Number.isInteger(value) && value >= 0 && value <= 100);

      if (isValid) {
        console.log(`MQTT - Topic: ${topic}, Moisture:`, moisture);

        // Prepare the WebSocket message
        const sectorNumber = topic.replace('sector', '');
        const sectorMessage = {
          topic,
          message: { [`moisture${sectorNumber}`]: moisture },
        };

        // Broadcast to all connected WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(sectorMessage));
          }
        });
      } else {
        console.warn(`Invalid moisture values in topic "${topic}":`, parsedMessage);
      }
    } else if (parsedMessage.rawMessage) {
      // Handle raw string messages
      console.log(`MQTT - Topic: ${topic}, Raw Message:`, parsedMessage.rawMessage);

      // Broadcast raw string messages to WebSocket clients if needed
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ topic, message: parsedMessage.rawMessage })
          );
        }
      });
    } else {
      console.warn(`Unexpected message format from topic "${topic}":`, messageString);
    }
  } catch (err) {
    console.error(`Failed to process message from topic "${topic}":`, err.message);
  }
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected.');

  ws.on('message', (data) => {
    try {
      const { sector, message } = JSON.parse(data);

      if (sector && message) {
        const topic = `${sector}`; // e.g., sector1/control
        mqttClient.publish(topic, message, { qos: 1 }, (err) => {
          if (err) {
            console.error(`Error publishing to MQTT topic ${topic}:`, err.message);
            ws.send(JSON.stringify({ status: 'error', error: err.message }));
          } else {
            console.log(`Published to ${topic}: ${message}`);
            ws.send(
              JSON.stringify({ status: 'success', sector, message })
            ); // Acknowledge the client
          }
        });
      } else {
        console.error('Invalid message format:', data);
        ws.send(JSON.stringify({ status: 'error', error: 'Invalid message format' }));
      }
    } catch (err) {
      console.error('Error processing message:', err.message);
      ws.send(JSON.stringify({ status: 'error', error: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
});

// Handle additional WebSocket events
wss.on('connection', (ws) => {
  ws.on('close', () => {
    console.log('WebSocket client disconnected.');
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
});
