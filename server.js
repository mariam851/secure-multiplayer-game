require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socket = require('socket.io');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();
const server = http.createServer(app);
const io = socket(server);

// ==================== Middleware ====================

// Security headers
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.noCache());
app.use(helmet.hidePoweredBy());

// Fake X-Powered-By
app.use((req, res, next)=>{
  res.setHeader('X-Powered-By', 'PHP 7.4.3');
  next();
});

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for FCC testing
app.use(cors({ origin: '*' }));

// Serve static files
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

// ==================== Routes ====================

// Index page
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// FCC Testing Routes
fccTestingRoutes(app);

// 404 Middleware
app.use((req, res, next) => {
  res.status(404).type('text').send('Not Found');
});

// ==================== Socket.io ====================

// Example: listen to connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ==================== Start Server ====================
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Listening on port ${port}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For FCC testing
