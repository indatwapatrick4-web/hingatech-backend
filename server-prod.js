const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Use environment variable for port (Render sets this automatically)
const PORT = process.env.PORT || 3000;

// Store readings in memory (for free tier)
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
  
  console.log("\n📡 RECEIVED FROM DEVICE:", device_id);
  console.log(`   🌡️ Temperature: ${temperature}°C`);
  console.log(`   💧 Humidity: ${humidity}%`);
  console.log(`   🌱 Soil Moisture: ${soil_moisture}%`);
  
  if (dht_working !== undefined && sensorStatus.dht22 !== dht_working) {
    sensorStatus.dht22 = dht_working;
    console.log(`   📢 DHT22 Sensor: ${dht_working ? "ONLINE ✅" : "OFFLINE ⚠️"}`);
  }
  
  if (soil_working !== undefined && sensorStatus.soil !== soil_working) {
    sensorStatus.soil = soil_working;
    console.log(`   📢 Soil Sensor: ${soil_working ? "ONLINE ✅" : "OFFLINE ⚠️"}`);
  }
  
  sensorStatus.lastUpdate = new Date().toISOString();
  
  if (!device_id || temperature == null || humidity == null || soil_moisture == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  
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
  res.json(Object.values(latestByDevice));
});

// GET endpoint - all readings
app.get("/api/sensor/all", (req, res) => {
  res.json(readings);
});

// GET endpoint - stats
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 API URL: https://your-render-url.onrender.com`);
  console.log("\n💡 Waiting for ESP8266 data...\n");
});
