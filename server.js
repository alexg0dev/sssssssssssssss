const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Pusher only if we have the required config
let pusher = null;
try {
  const Pusher = require('pusher');
  pusher = new Pusher({
    appId: "1994413",
    key: "81448c8d861b0292ba68",
    secret: "64a8f74fb2857985d69b",
    cluster: "eu",
    useTLS: true
  });
  console.log('Pusher initialized successfully');
} catch (error) {
  console.error('Failed to initialize Pusher:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper headers
app.use(express.static(path.join(__dirname), {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Serve static files
app.get('/', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'index.html'));
  } catch (error) {
    console.error('Error serving index.html:', error);
    res.status(500).send('Server Error');
  }
});

// API endpoints for Pusher events
app.post('/api/trigger', (req, res) => {
  if (!pusher) {
    return res.status(500).json({ error: 'Pusher not initialized' });
  }
  
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
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pusher: pusher ? 'connected' : 'not available'
  });
});

// Railway health check
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Keep alive endpoint
app.get('/keepalive', (req, res) => {
  res.status(200).json({ alive: true });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Debate Hub server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server ready at http://0.0.0.0:${port}`);
  console.log('Health check available at /health');
});
