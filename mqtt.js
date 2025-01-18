// MQTT Configuration
let IP = "5.196.78.28"; // Broker IP address
let port = 1883; // MQTT broker port
console.log(`${sectorId}`)

// Create a new MQTT client
function createClient(clientId) {
    return new Paho.MQTT.Client(IP, port, clientId);
}

// Publish MQTT message with sector data and motor state
function publishMQTT(sectorId, payload) {
    const topic = `sector${sectorId}`;
    const message = new Paho.MQTT.Message(JSON.stringify(payload));
    message.destinationName = topic;

    const client = createClient(`client_${sectorId}_${Date.now()}`);
    
    client.connect({
        onSuccess: function () {
            console.log(`Connected to broker. Sending data to ${topic}`);
            client.send(message);
            client.disconnect();
        },
        onFailure: function (error) {
            console.error("Connection failed:", error.errorMessage);
        }
    });
}

// Update progress bars and percentage labels for moisture data
function updateProgressBar(sectorId, moistureData) {
    // Update sensor progress bars and labels
    for (let i = 1; i <= 4; i++) {
        const sensorBar = document.querySelector(`#sector${sectorId} .progress-bar:nth-child(${i}) .progress`);
        const sensorLabel = document.querySelector(`#sensor${i}-label`);
        
        if (sensorBar && sensorLabel) {
            const moistureValue = moistureData[i-1];
            sensorBar.style.width = `${moistureValue}%`;
            sensorLabel.textContent = `Sensor ${i}: ${moistureValue.toFixed(1)}%`;
        }
    }

    // Calculate average moisture level and update the progress bar
    const avg = moistureData.reduce((a, b) => a + b, 0) / moistureData.length;
    const avgBar = document.querySelector(`#sector${sectorId} .avg-bar .progress`);
    const avgLabel = document.querySelector(`#avg-label${sectorId}`);

    if (avgBar && avgLabel) {
        avgBar.style.width = `${avg}%`;
        avgLabel.textContent = `Avg: ${avg.toFixed(1)}%`;
    }
}

// Simulate real-time sensor data (remove if using actual sensor data)
setInterval(() => {
    const sector1Data = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];
    updateProgressBar(1, sector1Data);
}, 3000);

// Toggle motor state and update UI
function toggleState(sectorId) {
    const toggle = document.getElementById(`toggle${sectorId}`);
    const isOn = toggle.classList.toggle('on');
    const state = isOn ? 1 : 0;

    // Simulate sensor data (replace with actual sensor readings)
    const moistureData = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];

    // Create payload to send via MQTT
    const payload = {
        moisture: moistureData,
        motor: state
    };

    // Publish data to MQTT broker
    publishMQTT(sectorId, payload);

    // Update label text based on motor state
    const label = toggle.previousElementSibling;
    label.textContent = `Motor for Sector ${sectorId}: ${state === 1 ? "ON" : "OFF"}`;

    // Update progress bars with new moisture data
    updateProgressBar(sectorId, moistureData);
}
