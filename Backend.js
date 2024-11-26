const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

// Function to send messages to all connected WebSocket clients
function broadcastMessage(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Handle incoming sensor data
app.post('/sensor-data', async (req, res) => {
    const { sensorId, temperature, bandwidth, alerts, ipAddress } = req.body;

    // Check if data is valid
    if (!sensorId || !temperature || !bandwidth || !alerts || !ipAddress) {
        return res.status(400).json({ message: 'Missing required sensor data' });
    }

    // Analyze sensor data
    let responseMessage = `Sensor: ${sensorId} - Data received.`;

    // Geolocation lookup for the IP address
    let geoLocation = await getGeolocation(ipAddress);

    // Check for threats based on thresholds
    if (temperature > 45) {
        responseMessage += ` High temperature detected (${temperature}°C). Quarantine initiated.`;
    }
    if (bandwidth > 80) {
        responseMessage += ` High bandwidth detected (${bandwidth} Mbps). Traffic restricted.`;
    }
    if (alerts > 3) {
        responseMessage += ` Frequent alerts detected (${alerts}). Triggering investigation.`;
    }

    // Add geolocation info to the message
    if (geoLocation) {
        responseMessage += ` IP Location: ${geoLocation.city}, ${geoLocation.region}, ${geoLocation.country}.`;
    }

    // Broadcast to frontend (real-time)
    broadcastMessage(JSON.stringify({ type: 'sensor-update', message: responseMessage }));

    // Send response
    res.json({ message: 'Data processed and analyzed', geoLocation, responseMessage });
});

// Function to get geolocation for a given IP address using IP-API
async function getGeolocation(ipAddress) {
    try {
        const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
        if (response.data.status === 'fail') {
            return null;
        }
        return {
            city: response.data.city,
            region: response.data.regionName,
            country: response.data.country
        };
    } catch (error) {
        console.error('Error retrieving geolocation:', error);
        return null;
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

