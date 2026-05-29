const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let readings = [];

app.post('/api/sensor', (req, res) => {
  console.log('Received:', req.body);
  readings.push(req.body);
  res.status(201).json({ message: 'OK' });
});

app.get('/api/sensor/latest', (req, res) => {
  res.json(readings.slice(-10));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server on port ${port}`));
