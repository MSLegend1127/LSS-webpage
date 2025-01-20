// WebSocket or MQTT Configuration
const IP = "ws://<giga-websocket-address>"; // Replace with the GIGA's WebSocket/MQTT URL
const socket = new WebSocket(IP); // WebSocket connection to the GIGA

// Event: WebSocket opened
socket.onopen = () => {
    console.log("Connected to GIGA WebSocket");
};

// Event: WebSocket message received
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "moistureUpdate") {
        // Update the progress bars for the given sector
        const sectorId = data.sectorId;
        const moistureData = data.moisture;

        updateProgressBar(sectorId, moistureData);
    }
};

// Update progress bars and percentage labels for moisture data
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

    // Calculate average moisture level and update the average progress bar
    const avg = moistureData.reduce((a, b) => a + b, 0) / moistureData.length;
    const avgBar = document.querySelector(`#sector${sectorId}-avg`);
    const avgLabel = document.querySelector(`#sector${sectorId}-avg-label`);

    if (avgBar && avgLabel) {
        avgBar.style.width = `${avg}%`;
        avgLabel.textContent = `Avg: ${avg.toFixed(1)}%`;
    }
}

// Toggle motor state and send the command to GIGA
function toggleState(sectorId) {
    const toggle = document.getElementById(`toggle${sectorId}`);
    const isOn = toggle.classList.toggle('off'); // Toggle button state
    const state = isOn ? "OFF" : "ON"; // Motor state: ON or OFF

    // Update toggle button label
    toggle.textContent = `Motor: ${state}`;

    // Send motor command to GIGA
    const message = {
        type: "toggleMotor",
        sectorId: sectorId,
        state: state
    };
    socket.send(JSON.stringify(message));
}
