// WebSocket and MQTT setup
const mqttBrokerUrl = 'ws://5.196.78.28:9001'; // WebSocket-based MQTT broker URL (adjust port for WebSocket support)
const mqttClient = mqtt.connect(mqttBrokerUrl);

// Handle MQTT connection events
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// Toggle sprinkler state and send MQTT message
function toggleState(sectorNumber) {
  const toggle = document.getElementById(`toggle${sectorNumber}`);
  const isOn = toggle.classList.toggle('on'); // Toggle the "on" class
  const message = isOn ? 'sprinkler:on' : 'sprinkler:off'; // Determine message based on state

  // Send the message to the server via WebSocket
  if (ws.readyState === WebSocket.OPEN) {
    const data = JSON.stringify({
      sector: `sector${sectorNumber}`,
      message: message,
    });
    ws.send(data);
    console.log('Sent to server:', data);
  } else {
    console.error('WebSocket connection is not open');
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
    const { topic, message } = data;

    if (topic.startsWith('sector')) {
      const sectorId = topic; // e.g., "sector1"
      updateSectorData(sectorId, message);
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

// Update sector with real-time data
function updateSectorData(sectorId, message) {
  const sectorNumber = sectorId.replace('sector', '');
  const moistureKey = `moisture${sectorNumber}`;
  const moisture = message[moistureKey];

  if (Array.isArray(moisture) && moisture.length === 4) {
    // Update individual sensor bars
    moisture.forEach((value, index) => {
      const sensorElement = document.getElementById(`${sectorId}-sensor${index + 1}`);
      if (sensorElement) {
        sensorElement.style.width = `${value}%`;
        // sensorElement.innerText = `${value}%`;

        // Set color based on moisture level
        if (value < 30) {
          sensorElement.style.backgroundColor = '#e74c3c'; // Red (dry)
        } else if (value >= 30 && value < 50) {
          sensorElement.style.backgroundColor = '#f1c40f'; // Yellow (moderate)
        } else if (value >= 50 && value < 80) {
          sensorElement.style.backgroundColor = '#2ecc71'; // Green (wet)
        } else {
          sensorElement.style.backgroundColor = '#3498db'; // Blue (oversaturated)
        }
      }
    });

// Calculate and update the average
const average = Math.round(moisture.reduce((sum, val) => sum + val, 0) / moisture.length);
const avgBar = document.getElementById(`sector${sector}-avg`);
const avgLabel = document.getElementById(`sector${sectorId}-avg-label`);

if (avgBar) {
  // Update the width of the average bar
  avgBar.style.width = `${average}%`;

  // Change the color of the bar based on the average moisture level
  if (average < 30) {
    avgBar.style.backgroundColor = '#e74c3c'; // Red (dry)
  } else if (average >= 30 && average < 50) {
    avgBar.style.backgroundColor = '#f1c40f'; // Yellow (moderate)
  } else if (average >= 50 && average < 80) {
    avgBar.style.backgroundColor = '#2ecc71'; // Green (wet)
  } else {
    avgBar.style.backgroundColor = '#3498db'; // Blue (oversaturated)
  }
}

if (avgLabel) {
  // Update the text to display the current average value
  avgLabel.innerText = `Average: ${average}%`;
}


// Intersection Observer setup (same as before)
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const sectorId = entry.target.id;
    if (entry.isIntersecting) {
      onSectorVisible(sectorId);
    } else {
      onSectorHidden(sectorId);
    }
  });
});

document.querySelectorAll('.sector').forEach((sector) => {
  observer.observe(sector);

});