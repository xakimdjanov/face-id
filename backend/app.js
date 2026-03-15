require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const os = require("os");

const setupSwagger = require("./swagger/swagger");
const routes = require("./routes/index.routes");
const { sequelize } = require("./models");
const { startAlertStreamLoop, attachWSS, testWebSocket } = require("./services/hikvision.service");

const app = express();

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(cors({ 
  origin: [
    "http://localhost:5173",  // Vite default
    "http://localhost:3000",   // React default
    "http://127.0.0.1:5173",
    "http://localhost:2000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api", routes);

// Swagger
setupSwagger(app);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    hostname: os.hostname()
  });
});

// WebSocket test endpoint
app.get("/ws-test", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WebSocket Test</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          #status { padding: 10px; margin: 10px 0; border-radius: 5px; }
          .connected { background: #d4edda; color: #155724; }
          .disconnected { background: #f8d7da; color: #721c24; }
          button { padding: 10px 20px; margin: 5px; cursor: pointer; }
          #log { height: 200px; overflow: auto; border: 1px solid #ccc; padding: 10px; }
        </style>
      </head>
      <body>
        <h1>WebSocket Test Page</h1>
        <div id="status" class="disconnected">🔴 Disconnected</div>
        <button onclick="connect()">Connect</button>
        <button onclick="disconnect()">Disconnect</button>
        <button onclick="sendPing()">Send Ping</button>
        <div id="log"></div>
        <script>
          let ws = null;
          const statusDiv = document.getElementById('status');
          const logDiv = document.getElementById('log');
          
          function addLog(msg) {
            const div = document.createElement('div');
            div.textContent = new Date().toLocaleTimeString() + ': ' + msg;
            logDiv.appendChild(div);
            logDiv.scrollTop = logDiv.scrollHeight;
          }
          
          function connect() {
            if (ws) ws.close();
            
            const wsUrl = 'ws://' + window.location.host + '/ws/enroll';
            addLog('Connecting to ' + wsUrl + '...');
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
              statusDiv.className = 'connected';
              statusDiv.innerHTML = '🟢 Connected';
              addLog('✅ WebSocket connected');
            };
            
            ws.onclose = (event) => {
              statusDiv.className = 'disconnected';
              statusDiv.innerHTML = '🔴 Disconnected (code: ' + event.code + ')';
              addLog('❌ WebSocket disconnected: ' + event.code + ' ' + event.reason);
            };
            
            ws.onerror = (error) => {
              addLog('⚠️ WebSocket error: ' + JSON.stringify(error));
            };
            
            ws.onmessage = (event) => {
              addLog('📩 Received: ' + event.data);
              try {
                const data = JSON.parse(event.data);
                if (data.type === 'CARD') {
                  addLog('💳 CARD DETECTED: ' + data.cardNo);
                }
              } catch (e) {
                // not JSON
              }
            };
          }
          
          function disconnect() {
            if (ws) {
              ws.close();
              ws = null;
            }
          }
          
          function sendPing() {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
              addLog('📤 Sent PING');
            } else {
              addLog('⚠️ WebSocket not connected');
            }
          }
          
          // Auto connect on page load
          window.onload = connect;
        </script>
      </body>
    </html>
  `);
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket attach (for enroll card events)
console.log("📡 Initializing WebSocket server...");
try {
  attachWSS(server);
  console.log("✅ WebSocket server initialized");
} catch (err) {
  console.error("❌ WebSocket server error:", err);
}

// Start device alertStream (card events) loop
console.log("🔄 Starting alert stream loop...");
try {
  startAlertStreamLoop();
  console.log("✅ Alert stream loop started");
} catch (err) {
  console.error("❌ Alert stream error:", err);
}

const PORT = process.env.PORT || 2000;

// Database connection and server start
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Database connected successfully");
    return sequelize.sync({ alter: false });
  })
  .then(() => {
    console.log("✅ Database synced");
    
    server.listen(PORT, () => {
      console.log("\n" + "=".repeat(50));
      console.log(`🚀 Server is running!`);
      console.log("=".repeat(50));
      console.log(`📍 HTTP:  http://localhost:${PORT}`);
      console.log(`📍 Swagger: http://localhost:${PORT}/swagger`);
      console.log(`📍 WebSocket: ws://localhost:${PORT}/ws/enroll`);
      console.log(`📍 WebSocket Test: http://localhost:${PORT}/ws-test`);
      console.log(`📍 Health: http://localhost:${PORT}/health`);
      console.log("=".repeat(50) + "\n");
    });
  })
  .catch((err) => {
    console.error("❌ Database error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});