const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Logging middleware
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

// Import routes
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);

// Import models
const AccessCode = require('./models/AccessCode');
const ScanResult = require('./models/ScanResult');
const User = require('./models/User');

// Socket.io untuk komunikasi real-time
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined room');
  });
  
  socket.on('scan-started', (data) => {
    // Log scan activity
    const scanLog = `[${new Date().toISOString()}] Scan started for MEGA ID: ${data.megaId}\n`;
    fs.appendFile(path.join(__dirname, 'logs', 'scan.log'), scanLog, (err) => {
      if (err) console.error('Error writing to scan log:', err);
    });
    
    // Broadcast ke semua clients
    socket.broadcast.emit('scan-activity', {
      message: `Scan started for MEGA ID: ${data.megaId}`,
      timestamp: new Date(),
      type: 'info'
    });
  });
  
  socket.on('scan-completed', (data) => {
    // Log scan completion
    const scanLog = `[${new Date().toISOString()}] Scan completed for MEGA ID: ${data.megaId}, Results: ${JSON.stringify(data.results)}\n`;
    fs.appendFile(path.join(__dirname, 'logs', 'scan.log'), scanLog, (err) => {
      if (err) console.error('Error writing to scan log:', err);
    });
    
    // Broadcast ke semua clients
    socket.broadcast.emit('scan-activity', {
      message: `Scan completed for MEGA ID: ${data.megaId}`,
      timestamp: new Date(),
      type: 'success'
    });
    
    // Simpan hasil scan ke database
    const newScanResult = new ScanResult({
      megaId: data.megaId,
      results: data.results,
      accuracy: data.accuracy,
      timestamp: new Date()
    });
    
    newScanResult.save()
      .then(() => console.log('Scan result saved to database'))
      .catch(err => console.error('Error saving scan result:', err));
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes untuk halaman
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/server-load', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'server-load.html'));
});

app.get('/scanner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scanner.html'));
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Tugas cron untuk membersihkan kod akses yang telah tamat tempoh
cron.schedule('0 0 * * *', async () => {
  try {
    const expiredCodes = await AccessCode.find({ 
      expiresAt: { $lt: new Date() } 
    });
    
    for (const code of expiredCodes) {
      code.active = false;
      await code.save();
      console.log(`Expired access code deactivated: ${code.code}`);
    }
  } catch (error) {
    console.error('Error cleaning expired access codes:', error);
  }
});

// Tangani error 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ██████╗ ███████╗ █████╗ ██╗      ██████╗ ███████╗ █████╗ ███╗   ██╗
  ██╔══██╗██╔════╝██╔══██╗██║     ██╔════╝ ██╔════╝██╔══██╗████╗  ██║
  ██████╔╝█████╗  ███████║██║     ██║  ███╗███████╗███████║██╔██╗ ██║
  ██╔══██╗██╔══╝  ██╔══██║██║     ██║   ██║╚════██║██╔══██║██║╚██╗██║
  ██║  ██║███████╗██║  ██║███████╗╚██████╔╝███████║██║  ██║██║ ╚████║
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
  `);
  console.log(`RealScan Premium v2.0.0`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}`);
  console.log(`Scanner: http://localhost:${PORT}/scanner`);
  console.log(`API Status: http://localhost:${PORT}/api/status`);
});

module.exports = app;
