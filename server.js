const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Store readings in memory
let readings = [];
let nextId = 1;

console.log("🔥 HingaTech Backend Starting...");

// POST endpoint - Receive sensor data
app.post('/api/sensor', (req, res) => {
  const { device_id, temperature, humidity, soil_moisture } = req.body;
  
  console.log("\n📡 Received:", device_id);
  console.log(`   🌡️ Temperature: ${temperature}°C`);
  console.log(`   💧 Humidity: ${humidity}%`);
  console.log(`   🌱 Soil Moisture: ${soil_moisture}%`);
  
  // Validate required fields
  if (!device_id || temperature === undefined || humidity === undefined || soil_moisture === undefined) {
    console.log("   ❌ Missing fields");
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  // Save reading
  const reading = {
    id: nextId++,
    device_id: device_id,
    temperature: temperature,
    humidity: humidity,
    soil_moisture: soil_moisture,
    recorded_at: new Date().toISOString()
  };
  
  readings.unshift(reading);
  
  // Keep only last 100 readings
  if (readings.length > 100) readings.pop();
  
  console.log(`   ✅ Saved! Total: ${readings.length}`);
  res.status(201).json({ message: "Reading saved", id: reading.id });
});

// GET endpoint - Latest readings
app.get('/api/sensor/latest', (req, res) => {
  // Get latest reading per device
  const latestByDevice = {};
  for (const r of readings) {
    if (!latestByDevice[r.device_id]) {
      latestByDevice[r.device_id] = r;
    }
  }
  const result = Object.values(latestByDevice);
  console.log(`📊 Latest request - ${result.length} device(s)`);
  res.json(result);
});

// GET endpoint - All readings
app.get('/api/sensor/all', (req, res) => {
  console.log(`📊 All readings request - ${readings.length} total`);
  res.json(readings);
});

// GET endpoint - Specific device
app.get('/api/sensor/device/:device_id', (req, res) => {
  const deviceReadings = readings.filter(r => r.device_id === req.params.device_id);
  res.json(deviceReadings);
});

// Root endpoint - For testing
app.get('/', (req, res) => {
  res.json({
    message: "HingaTech Smart Farm API is running!",
    endpoints: {
      post: "POST /api/sensor - Send sensor data",
      latest: "GET /api/sensor/latest - Get latest readings",
      all: "GET /api/sensor/all - Get all readings",
      device: "GET /api/sensor/device/:device_id - Get device history"
    },
    total_readings: readings.length
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 https://hingatech-backend-vj21.onrender.com`);
  console.log(`📊 https://hingatech-backend-vj21.onrender.com/api/sensor/latest`);
  console.log("\n💡 Waiting for ESP8266 data...\n");
});
