require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const os = require("os");

const setupSwagger = require("./swagger/swagger");
const routes = require("./routes/index.routes");
const enrollRoutes = require("./routes/enroll.routes");
const employeeRoutes = require("./routes/employee.routes");
const { sequelize } = require("./models");
const { startAlertStreamLoop, attachWSS } = require("./services/hikvision.service");

const app = express();
const server = http.createServer(app);

//////////////////////////////////////////////////
// MIDDLEWARE
//////////////////////////////////////////////////

app.use(express.json({ limit: "2mb" }));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ],
  credentials: true
}));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

//////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////

app.use("/api", routes);
app.use("/api/enroll", enrollRoutes);
app.use("/api/employees", employeeRoutes);
setupSwagger(app);

//////////////////////////////////////////////////
// HEALTH CHECK
//////////////////////////////////////////////////

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    hostname: os.hostname(),
    time: new Date().toISOString()
  });
});

//////////////////////////////////////////////////
// ✅ ENG MUHIM — FAQAT BIR MARTA!
//////////////////////////////////////////////////

attachWSS(server);
startAlertStreamLoop();

//////////////////////////////////////////////////
// SERVER START
//////////////////////////////////////////////////

const PORT = process.env.PORT || 2000;

(async () => {
  try {

    await sequelize.authenticate();
    console.log("✅ Database connected");

    await sequelize.sync({ alter: false });
    console.log("✅ Database synced");

    server.listen(PORT, () => {

      console.log("\n" + "=".repeat(50));
      console.log("🚀 SERVER STARTED");
      console.log("=".repeat(50));

      console.log(`🌐 HTTP:        http://localhost:${PORT}`);
      console.log(`📡 WebSocket:   ws://localhost:${PORT}/ws/enroll`);
      console.log(`📘 Swagger:     http://localhost:${PORT}/swagger`);
      console.log(`❤️ Health:      http://localhost:${PORT}/health`);

      console.log("=".repeat(50) + "\n");

    });

  } catch (err) {

    console.error("❌ SERVER START ERROR:");
    console.error(err);

    process.exit(1);
  }
})();

//////////////////////////////////////////////////
// GRACEFUL SHUTDOWN
//////////////////////////////////////////////////

process.on("SIGINT", () => {

  console.log("\n📴 Shutting down server...");

  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });

});
