let ws = new WebSocket('ws://localhost:8080');

// WebSocket setup
ws.onopen = () => {
  console.log('WebSocket connection established');
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    const { topic, message } = data;

    if (topic.startsWith('sector')) {
      const sectorId = topic; // e.g., "sector1"
      const sectorElement = document.getElementById(sectorId);

      // Check if the sector is visible
      if (sectorElement && sectorElement.classList.contains('visible')) {
        updateSectorData(sectorId, message);
      }
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

// Scroll to the specific sector
// function navToSector(sectorId) {
//   document.getElementById(sectorId).scrollIntoView({ behavior: 'smooth' });
// }

// Update the sector with real-time data
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
        sensorElement.innerText = `${value}%`;
      }
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
        
    });

    // Calculate and update the average
    const average = Math.round(moisture.reduce((sum, val) => sum + val, 0) / moisture.length);
    const avgBar = document.getElementById(`${sectorId}-avg`);
    const avgLabel = document.getElementById(`${sectorId}-avg-label`);
    if (avgBar) avgBar.style.width = `${average}%`;
    if (avgLabel) avgLabel.innerText = `Average: ${average}%`;
  } else {
    console.error(`Invalid moisture data for ${sectorId}:`, message);
  }
}

// Toggle state management
function toggleState(sectorNumber) {
    const toggle = document.getElementById(`toggle${sectorNumber}`);
    const isOn = toggle.classList.toggle('on'); // Toggle the "on" class
    const message = isOn ? 'sprinkler:on' : 'sprinkler:off'; // Determine message based on state
  

    // Send message via WebSocket
    if (ws.readyState === WebSocket.OPEN) {
      const topic = `sector${sectorNumber}`;
      const data = { topic, message };
      ws.send(JSON.stringify(data)); // Send message to the WebSocket server
      console.log(`${topic}:${message}`);
      

    } else {
      console.error('WebSocket connection is not open');
    }
  }

// Handle sector visibility
function onSectorVisible(sectorId) {
  const sector = document.getElementById(sectorId);
  console.log(`Sector${sectorId} is now visible`);
  updateSectorData(sectorId);
}

function onSectorHidden(sectorId) {
  const sector = document.getElementById(sectorId);
  console.log(`Sector${sectorId} is now hidden`);
}

// Intersection Observer setup
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

// Observe each sector
document.querySelectorAll('.sector').forEach((sector) => {
  observer.observe(sector);
});
