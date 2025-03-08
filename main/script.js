// MQTT and WebSocket setup
const mqttBrokerUrl = 'ws://5.196.78.28:9001'; // WebSocket-based MQTT broker URL
const mqttClient = mqtt.connect(mqttBrokerUrl);

// Handle MQTT connection events
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

function toggleState(sectorNumber) {
  const toggle = document.getElementById(`toggle${sectorNumber}`);
  const isOn = toggle.classList.toggle('on'); // Toggle the "on" class
  toggle.classList.toggle('off', !isOn); // Toggle the "off" class
  const message = isOn ? 'sprinkler:on' : 'sprinkler:off';

  // Send the toggle message to the WebSocket server
  if (ws.readyState === WebSocket.OPEN) {
    const data = JSON.stringify({
      sector: `sector${sectorNumber}`,
      message: message,
    });
    ws.send(data);
    console.log('Sent toggle message to server:', data);
  } else {
    console.error('WebSocket connection is not open.');
  }
}

// WebSocket setup (for receiving real-time updates from the server)
let ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);

    // Handle acknowledgment from the backend
    if (data.status === 'success' && data.sector && data.message) {
      console.log(`Acknowledgment received from server for ${data.sector}: ${data.message}`);
    }

    // Handle real-time updates for moisture data
    const { topic, message } = data;
    if (topic && topic.startsWith('sector')) {
      updateSectorData(topic, message);
    }
  } catch (err) {
    console.error('Failed to process WebSocket message:', event.data, 'Error:', err.message);
  }
};

ws.onclose = () => {
  console.log('WebSocket connection closed. Retrying...');
  setTimeout(() => {
    ws = new WebSocket('ws://localhost:8080');
  }, 5000);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Utility function to determine moisture color
function getMoistureColor(value) {
  if (value < 30) return '#e74c3c'; // Red (dry)
  if (value < 50) return '#f1c40f'; // Yellow (moderate)
  if (value < 80) return '#2ecc71'; // Green (wet)
  return '#3498db'; // Blue (oversaturated)
}

// Update sector with real-time data
function updateSectorData(sectorId, message) {
  const sectorNumber = sectorId.replace('sector', ''); // Extract the sector number
  const moistureKey = `moisture${sectorNumber}`; // Example: "moisture1" for sector1
  const moisture = message[moistureKey]; // Extract the moisture array

  if (Array.isArray(moisture) && moisture.length === 4) {
    // Update individual sensor bars and labels
    moisture.forEach((value, index) => {
      const sensorElement = document.getElementById(`${sectorId}-sensor${index + 1}`); // Bar
      const percentageLabel = document.getElementById(`${sectorId}-sensor${index + 1}-label`); // Label

      if (sensorElement) {
        sensorElement.style.width = `${value}%`;
        sensorElement.style.backgroundColor = getMoistureColor(value);
      }

      if (percentageLabel) {
        percentageLabel.innerText = `sensor${index + 1}: ${value}%`; // Display the percentage
        percentageLabel.style.fontSize = '22px' ;
        
        percentageLabel.style.color = getMoistureColor(value); // Match bar color
      }
    });

    // Calculate and update the average bar
    const average = Math.round(moisture.reduce((sum, val) => sum + val, 0) / moisture.length);
    const avgBar = document.getElementById(`sector${sectorNumber}-avg`);
    const avgLabel = document.getElementById(`sector${sectorNumber}-avg-label`);
    const avgPercentageLabel = document.getElementById(`sector${sectorNumber}-avg-percentage`);

    if (avgBar) {
      avgBar.style.width = `${average}%`;
      avgBar.style.backgroundColor = getMoistureColor(average);
    }

    if (avgPercentageLabel) {
      avgPercentageLabel.innerText = `${average}%`; // Update percentage
      avgPercentageLabel.style.color = getMoistureColor(average); // Match bar color
    }

    if (avgLabel) {
      avgLabel.innerText = `Average: ${average}%`; // Keep it static and display average
      avgLabel.style.fontSize = '22px';
    }
  } else {
    console.error('Invalid moisture data received for:', sectorId);
  }
}
