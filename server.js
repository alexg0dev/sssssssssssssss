const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

// Endpoint to receive IP and store it in info.json
app.post('/verify-ip', (req, res) => {
  const { ip } = req.body;

  if (!ip) {
    return res.status(400).json({ message: 'IP address is required.' });
  }

  const filePath = './info.json';
  const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];

  // Add new IP to info.json
  data.push({ ip, timestamp: new Date().toISOString() });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`Stored new IP: ${ip}`);
  res.status(200).json({ message: 'IP stored successfully' });
});

// Start server on port 3000
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
