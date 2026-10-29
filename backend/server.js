require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const { Server } = require('socket.io');
const { testConnection } = require('./src/config/db');
const routes             = require('./src/routes');

const app    = express();
const server = http.createServer(app);

// ─── Socket.io Setup ───────────────────────────────────────────
// origin: '*' untuk kemudahan development; ganti ke CLIENT_URL saat production
const io = new Server(server, {
  cors: {
    origin:  '*',
    methods: ['GET', 'POST'],
  },
});

// ─── Expose io to routes/controllers ──────────────────────────────────────────
app.set('io', io);

const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject instance io ke setiap request agar bisa diakses di controller
// via req.io.emit(...)
app.use((req, _res, next) => {
  req.io = io;
  next();
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Warkop API is running 🍵', timestamp: new Date() });
});

// ─── Socket.io Event Listeners ─────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected    → id: ${socket.id}`);

  // Bergabung ke room khusus kasir (opsional, berguna untuk Tahap berikutnya)
  socket.on('join_cashier', () => {
    socket.join('cashier_room');
    console.log(`📺 Kasir joined cashier_room → id: ${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected → id: ${socket.id} | reason: ${reason}`);
  });
});

// ─── Start Server ──────────────────────────────────────────────
async function start() {
  await testConnection();           // Pastikan DB terkoneksi dulu
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT} (all network interfaces)`);
  });
}

start();
