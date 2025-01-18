        // MQTT Configuration
        const broker1 = "5.196.78.28"; // Replace with your broker's IP
        const port1 = 1883; // Replace with the broker's WebSocket port

        function createClient(clientId) {
            return new Paho.MQTT.Client(broker1, port1, clientId);
        }

        function publishMQTT(sectorId, topicSuffix, payload) {
            const topic = `sector${sectorId}`;
            const message = new Paho.MQTT.Message(payload);
            message.destinationName = topic;

            const client = createClient(`client_${sectorId}_${Date.now()}`);
            client.connect({
                onSuccess: function () {
                    console.log(`Connected to broker. Sending: ${payload} to ${topic}`);
                    client.send(message);
                    client.disconnect();
                },
                onFailure: function (error) {
                    console.error("Connection failed:", error.errorMessage);
                }
            });
        }

        // Function to update progress bars and percentage labels
        function updateProgressBar(sectorId, sensorValues) {
            for (let i = 1; i <= 4; i++) {
                const sensorBar = document.querySelector(`#sector${sectorId} .progress-bar:nth-child(${i}) .progress`);
                const sensorLabel = document.querySelector(`#sensor${i}-label`);
                sensorBar.style.width = `${sensorValues[i-1]}%`;
                sensorLabel.textContent = `Sensor ${i}: ${sensorValues[i-1].toFixed(1)}%`;
            }

            // Calculate average for the sector
            const avg = sensorValues.reduce((a, b) => a + b, 0) / sensorValues.length;
            const avgBar = document.querySelector(`#sector${sectorId} .avg-bar .progress`);
            const avgLabel = document.querySelector(`#avg-label${sectorId}`);
            avgBar.style.width = `${avg}%`;
            avgLabel.textContent = `Avg: ${avg.toFixed(1)}%`;
        }

        // Simulate data for each sector (you can replace this with real sensor data)
        setInterval(() => {
            const sector1Data = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];
            updateProgressBar(1, sector1Data);
        }, 3000); // Update every 3 seconds (simulate real-time data)

        // Toggle motor state
        function toggleState(sectorId) {
            const toggle = document.getElementById(`toggle${sectorId}`);
            const isOn = toggle.classList.toggle('on'); // Toggle the 'on' class
            const state = isOn ? "ON" : "OFF";
            const topicSuffix = `motor_state`; // Topic suffix for motor state

            // Publish MQTT message with the sector ID and state
            publishMQTT(sectorId, topicSuffix, state);

            // Optional: Update UI to indicate current state
            const label = toggle.previousElementSibling; // Get the label element
            label.textContent = `Motor for Sector ${sectorId}: ${state}`;
        }