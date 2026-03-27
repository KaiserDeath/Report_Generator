const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API running");
});

// import routes
const positionsRoutes = require("./routes/positions");
const evaluationsRoutes = require("./routes/evaluations");

app.use("/positions", positionsRoutes);
app.use("/evaluate", evaluationsRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));