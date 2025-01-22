let ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        updateSectorData(data);
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
};

function updateSectorData(data) {
    // Loop through each sector in the data
    Object.keys(data).forEach(sectorId => {
        const moistureValues = data[sectorId];
        // Update each sensor in the sector
        moistureValues.forEach((value, index) => {
            updateProgressBar(sectorId, index + 1, value);
        });
    });
}

function updateProgressBar(sectorId, sensorNumber, value) {
    // Update value display
    const valueElement = document.getElementById(`${sectorId}-sensor${sensorNumber}-value`);
    if (valueElement) {
        valueElement.textContent = value + '%';
    }

    // Update progress bar
    const progressBar = document.getElementById(`${sectorId}-sensor${sensorNumber}-progress`);
    if (progressBar) {
        
        progressBar.style.width = value + '%';
        progressBar.textContent = value + '%';
        
        // Update color based on moisture level
        if (value < 30) {
            progressBar.style.backgroundColor = '#e74c3c'; // Red for dry
        } else {
            progressBar.style.backgroundColor = '#2ecc71'; // Green for wet
        } 
    }
}

ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
};