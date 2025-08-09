const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Debate Hub server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server ready at http://0.0.0.0:${port}`);
});
