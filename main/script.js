let ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
  try {
    // Parse the JSON received from the server
    const data = JSON.parse(event.data);
    console.log(data);

    const { topic, message } = data;
    if (!topic || !message) {
      console.error('Invalid message format:', data);
      return;
    }

    // Dynamically update sectors
    if (topic.startsWith('sector')) {
      const sectorId = topic; // e.g., "sector1"
      const sectorNumber = sectorId.replace('sector', '');
      const moistureKey = `moisture${sectorNumber}`;
      const moisture = message[moistureKey];

      if (Array.isArray(moisture) && moisture.length === 4) {
        // Update sensor progress bars
        moisture.forEach((value, index) => {
          const sensorElement = document.getElementById(`${sectorId}-sensor${index + 1}`);
          if (sensorElement) {
            sensorElement.style.width = `${value}%`;
            sensorElement.innerText = `${value}%`; // Optional: Show percentage inside the bar
          } else {
            console.warn(`Element not found: ${sectorId}-sensor${index + 1}`);
          }
        });

        // Calculate and update average
        const average = Math.round(moisture.reduce((sum, val) => sum + val, 0) / moisture.length);
        const avgBar = document.getElementById(`${sectorId}-avg`);
        const avgLabel = document.getElementById(`${sectorId}-avg-label`);
        if (avgBar) avgBar.style.width = `${average}%`;
        if (avgLabel) avgLabel.innerText = `Average: ${average}%`;
      } else {
        console.error(`Invalid moisture data for ${sectorId}:`, message);
      }
    } else {
      console.error('Invalid topic:', topic);
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
