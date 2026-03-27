const express = require("express");
const router = express.Router();
const pool = require("../db");

// Create new position
router.post("/", async (req, res) => {
  const { name, description } = req.body;
  const result = await pool.query(
    "INSERT INTO positions (name, description) VALUES ($1, $2) RETURNING *",
    [name, description]
  );
  res.json(result.rows[0]);
});

// Add weights to a position
router.post("/:id/weights", async (req, res) => {
  const positionId = req.params.id;
  const weights = req.body; // { skill_id: weight }

  for (let skillId in weights) {
    await pool.query(
      "INSERT INTO position_skills (position_id, skill_id, weight) VALUES ($1, $2, $3)",
      [positionId, skillId, weights[skillId]]
    );
  }
  res.json({ message: "Weights saved" });
});

// Get all positions
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM positions");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Get all skills
router.get("/skills/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM skills");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching skills" });
  }
});

module.exports = router;