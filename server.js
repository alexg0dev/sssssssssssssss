const express = require('express');
const path = require('path');
const cors = require('cors');
const Pusher = require('pusher');

const app = express();
const port = process.env.PORT || 3000;

// Pusher configuration
const pusher = new Pusher({
  appId: "1994413",
  key: "81448c8d861b0292ba68",
  secret: "64a8f74fb2857985d69b",
  cluster: "eu",
  useTLS: true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// API endpoints for Pusher events
app.post('/api/trigger', (req, res) => {
  const { channel, event, data } = req.body;
  
  pusher.trigger(channel, event, data)
    .then(() => {
      res.json({ success: true });
    })
    .catch(err => {
      console.error('Pusher error:', err);
      res.status(500).json({ error: 'Failed to trigger event' });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Debate Hub server running on port ${port}`);
});
