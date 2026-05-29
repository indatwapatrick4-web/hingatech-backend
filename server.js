const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Store readings in memory
let readings = [];
let nextId = 1;

console.log("🔥 HingaTech Backend Starting...");

// POST endpoint - receive sensor data
app.post("/api/sensor", (req, res) => {
  const { device_id, temperature, humidity, soil_moisture, dht_working, soil_working } = req.body;
  
  console.log("\n📡 Received from device:", device_id);
  console.log(`   🌡️ Temperature: ${temperature}°C`);
  console.log(`   💧 Humidity: ${humidity}%`);
  console.log(`   🌱 Soil Moisture: ${soil_moisture}%`);
  
  if (!device_id || temperature == null || humidity == null || soil_moisture == null) {
    console.log("   ❌ ERROR: Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  const reading = {
    id: nextId++,
    device_id: device_id,
    temperature: temperature,
    humidity: humidity,
    soil_moisture: soil_moisture,
    recorded_at: new Date().toISOString()
  };
  
  readings.unshift(reading);
  if (readings.length > 500) readings.pop();
  
  console.log(`   ✅ Saved! Total readings: ${readings.length}`);
  res.status(201).json({ message: "Reading saved", id: reading.id });
});

// GET endpoint - latest readings
app.get("/api/sensor/latest", (req, res) => {
  const latestByDevice = {};
  for (const r of readings) {
    if (!latestByDevice[r.device_id]) {
      latestByDevice[r.device_id] = r;
    }
  }
  const result = Object.values(latestByDevice);
  console.log(`📊 Latest request - ${result.length} device(s) found`);
  res.json(result);
});

// GET endpoint - all readings
app.get("/api/sensor/all", (req, res) => {
  console.log(`📊 All readings request - ${readings.length} total`);
  res.json(readings);
});

// GET endpoint - specific device
app.get("/api/sensor/:device_id", (req, res) => {
  const deviceReadings = readings.filter(r => r.device_id === req.params.device_id).slice(0, 100);
  res.json(deviceReadings);
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "HingaTech Smart Farm API is running!",
    endpoints: {
      post: "/api/sensor - Send sensor data (POST)",
      latest: "/api/sensor/latest - Get latest readings",
      all: "/api/sensor/all - Get all readings"
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 API URL: https://hingatech-backend-vj21.onrender.com`);
  console.log(`📊 Latest data: https://hingatech-backend-vj21.onrender.com/api/sensor/latest`);
  console.log("\n💡 Waiting for ESP8266 data...\n");
});
