// WebSocket connection to server
const ws = new WebSocket('ws://localhost:8080'); // Change to your WebSocket server address

// Store sector data
let sectorData = {};

// WebSocket event handlers
ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        updateSectorData(data);
    } catch (error) {
        console.error('Error processing message:', error);
        console.error('Message data:', event.data);
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    console.error('WebSocket readyState:', ws.readyState);
};

// Update sector data and UI
function updateSectorData(data) {
    Object.keys(data).forEach((sectorId) => {
        const moistureArray = data[sectorId]; // No longer accessing a 'moisture' key
        sectorData[sectorId] = { moisture: moistureArray, motor: 0 }; // Default motor state is off (0)
        updateProgressBars(sectorId, moistureArray);
        updateMotorState(sectorId, 0); // Assume motor is off initially
    });
}

// Update progress bars for a sector
function updateProgressBars(sectorId, moistureArray) {
    if (!Array.isArray(moistureArray) || moistureArray.length !== 4) {
        console.error('Invalid moisture data for sector', sectorId);
        return;
    }

    // Update individual sensor bars
    moistureArray.forEach((value, index) => {
        const sensorBar = document.querySelector(`#${sectorId}-sensor${index + 1}`);
        if (sensorBar) {
            sensorBar.style.width = `${value}%`;
            sensorBar.textContent = `${value.toFixed(1)}%`;
        }
    });

    // Update average
    const avg = moistureArray.reduce((a, b) => a + b, 0) / moistureArray.length;
    let avgBar = document.querySelector(`#${sectorId}-avg`);
    let avgLabel = document.querySelector(`#${sectorId}-avg-label`);

    if (!avgBar || !avgLabel) {
        const avgContainer = createAverageBar(sectorId);
        avgBar = avgContainer.bar;
        avgLabel = avgContainer.label;
    }

    avgBar.style.width = `${avg}%`;
    avgLabel.textContent = `Avg: ${avg.toFixed(1)}%`;
}

// Update motor state UI
function updateMotorState(sectorId, state) {
    let toggle = document.getElementById(`${sectorId}-toggle`);
    if (!toggle) {
        toggle = createToggleButton(sectorId); // Dynamically create if not found
    }

    if (state === 1) {
        toggle.classList.add('on');
    } else {
        toggle.classList.remove('on');
    }
}

// Handle motor toggle
function toggleState(sectorId) {
    const toggle = document.getElementById(`${sectorId}-toggle`);
    const isOn = toggle.classList.toggle('on');
    const state = isOn ? 1 : 0;

    // Get current moisture values or default to zeros
    const currentData = sectorData[sectorId] || { moisture: [0, 0, 0, 0] };

    // Send update to server
    if (ws.readyState === WebSocket.OPEN) {
        const payload = {
            sectorId: sectorId,
            moisture: currentData.moisture,
            motor: state
        };
        ws.send(JSON.stringify(payload));
    }
}

// Create dynamic progress bar for sensors
function createProgressBar(sectorId, sensorId) {
    const sectorContainer = document.getElementById(sectorId) || createSectorContainer(sectorId);
    const progressBar = document.createElement('div');
    progressBar.id = `${sectorId}-sensor${sensorId}`;
    progressBar.className = 'progress-bar';
    sectorContainer.appendChild(progressBar);
    return progressBar;
}

// Create average progress bar
function createAverageBar(sectorId) {
    const sectorContainer = document.getElementById(sectorId) || createSectorContainer(sectorId);
    const avgBarContainer = document.createElement('div');
    const avgBar = document.createElement('div');
    const avgLabel = document.createElement('span');

    avgBar.id = `${sectorId}-avg`;
    avgLabel.id = `${sectorId}-avg-label`;
    avgBar.className = 'progress-bar avg-bar';
    avgBarContainer.appendChild(avgBar);
    avgBarContainer.appendChild(avgLabel);
    sectorContainer.appendChild(avgBarContainer);

    return { bar: avgBar, label: avgLabel };
}

// Create toggle button for motor state
function createToggleButton(sectorId) {
    const sectorContainer = document.getElementById(sectorId) || createSectorContainer(sectorId);
    const toggle = document.createElement('button');
    toggle.id = `${sectorId}-toggle`;
    toggle.className = 'toggle-button';
    toggle.textContent = `Motor ${sectorId}`;
    toggle.addEventListener('click', () => toggleState(sectorId));
    sectorContainer.appendChild(toggle);
    return toggle;
}

// Create sector container if not present
function createSectorContainer(sectorId) {
    const container = document.createElement('div');
    container.id = sectorId;
    container.className = 'sector-container';
    document.body.appendChild(container);
    return container;
}
