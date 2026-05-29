const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Store readings in memory
let readings = [];
let nextId = 1;
let sensorStatus = {
  dht22: true,
  soil: true,
  lastUpdate: null
};

console.log("🔥 HingaTech Backend Starting...");
console.log("📡 Waiting for data from ESP8266...");

// POST endpoint - receive sensor data
app.post("/api/sensor", (req, res) => {
  const { device_id, temperature, humidity, soil_moisture, dht_working, soil_working } = req.body;
  
  console.log("\n" + "=".repeat(50));
  console.log("📡 RECEIVED FROM DEVICE:", device_id);
  console.log("-".repeat(50));
  console.log(`   🌡️ Temperature: ${temperature}°C`);
  console.log(`   💧 Humidity: ${humidity}%`);
  console.log(`   🌱 Soil Moisture: ${soil_moisture}%`);
  console.log("-".repeat(50));
  
  // Update sensor status
  if (dht_working !== undefined) {
    if (sensorStatus.dht22 !== dht_working) {
      sensorStatus.dht22 = dht_working;
      console.log(`   📢 DHT22 Sensor: ${dht_working ? "ONLINE ✅" : "OFFLINE ⚠️"}`);
    }
  }
  
  if (soil_working !== undefined) {
    if (sensorStatus.soil !== soil_working) {
      sensorStatus.soil = soil_working;
      console.log(`   📢 Soil Sensor: ${soil_working ? "ONLINE ✅" : "OFFLINE ⚠️"}`);
    }
  }
  
  sensorStatus.lastUpdate = new Date().toISOString();
  
  // Validate required fields
  if (!device_id || temperature == null || humidity == null || soil_moisture == null) {
    console.log("   ❌ ERROR: Missing required fields");
    return res.status(400).json({ error: "Missing required fields" });
  }
  
  // Save reading
  const reading = {
    id: nextId++,
    device_id: device_id,
    temperature: temperature,
    humidity: humidity,
    soil_moisture: soil_moisture,
    dht_working: dht_working !== undefined ? dht_working : true,
    soil_working: soil_working !== undefined ? soil_working : true,
    recorded_at: new Date().toISOString()
  };
  
  readings.unshift(reading);
  if (readings.length > 500) readings.pop(); // Keep last 500 readings
  
  console.log(`   ✅ Saved! Total readings: ${readings.length}`);
  console.log("=".repeat(50));
  
  res.status(201).json({ message: "Reading saved", id: reading.id });
});

// GET endpoint - latest readings for dashboard
app.get("/api/sensor/latest", (req, res) => {
  // Get latest reading for each device
  const latestByDevice = {};
  for (const r of readings) {
    if (!latestByDevice[r.device_id]) {
      latestByDevice[r.device_id] = r;
    }
  }
  const result = Object.values(latestByDevice);
  console.log(`📊 Dashboard request - ${result.length} device(s) found`);
  res.json(result);
});

// GET endpoint - all readings (for chart)
app.get("/api/sensor/all", (req, res) => {
  res.json(readings);
});

// GET endpoint - specific device readings
app.get("/api/sensor/:device_id", (req, res) => {
  const deviceReadings = readings.filter(r => r.device_id === req.params.device_id).slice(0, 100);
  res.json(deviceReadings);
});

// GET endpoint - sensor status
app.get("/api/sensor/status", (req, res) => {
  res.json(sensorStatus);
});

// GET endpoint - statistics
app.get("/api/sensor/stats", (req, res) => {
  if (readings.length === 0) {
    res.json({ total: 0, avgTemp: 0, avgHumidity: 0, avgSoil: 0 });
    return;
  }
  
  let sumTemp = 0, sumHum = 0, sumSoil = 0;
  for (const r of readings) {
    sumTemp += r.temperature;
    sumHum += r.humidity;
    sumSoil += r.soil_moisture;
  }
  
  res.json({
    total: readings.length,
    avgTemp: (sumTemp / readings.length).toFixed(1),
    avgHumidity: Math.round(sumHum / readings.length),
    avgSoil: Math.round(sumSoil / readings.length),
    sensorStatus: sensorStatus
  });
});

// DELETE endpoint - clear all data (for testing)
app.delete("/api/sensor/all", (req, res) => {
  readings = [];
  nextId = 1;
  console.log("🗑️ All readings cleared");
  res.json({ message: "All readings cleared" });
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(50));
  console.log("✅ SERVER RUNNING SUCCESSFULLY!");
  console.log("=".repeat(50));
  console.log(`📍 Local URL: http://localhost:${PORT}`);
  console.log(`📍 Network URL: http://192.168.194.216:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/sensor/latest`);
  console.log("\n🎯 Make sure your ESP8266 sends data to:");
  console.log(`   http://192.168.194.216:${PORT}/api/sensor`);
  console.log("=".repeat(50));
  console.log("\n💡 Waiting for ESP8266 data...\n");
});