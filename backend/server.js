require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- Routes ---

// 1. Positions Route (Handles Roles and Skill Lists)
const positionsRoutes = require("./routes/positions");
app.use("/positions", positionsRoutes);

// 2. Evaluations Route (Handles Scoring and Math Logic)
const evaluationsRoutes = require("./routes/evaluations");
app.use("/evaluations", evaluationsRoutes);

// --- Health Check & DB Ping ---
app.get("/", async (req, res) => {
  try {
    const dbTest = await pool.query("SELECT NOW()");
    res.send(`🚀 API Running. Database Connected at: ${dbTest.rows[0].now}`);
  } catch (err) {
    console.error("❌ DB Connection Error:", err.message);
    res.status(500).send("API Running but Database Connection Failed.");
  }
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Positions API: http://localhost:${PORT}/positions`);
  console.log(`📍 Evaluations API: http://localhost:${PORT}/evaluations`);
});