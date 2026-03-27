const express = require("express");
const router = express.Router();
const pool = require("../db");

// Calculate score helper
function calculateScore(evaluation, weights) {
  let score = 0;
  for (let skillId in weights) {
    score += (evaluation[skillId] || 0) * weights[skillId];
  }
  return Number(score.toFixed(2));
}

// Evaluate trainee
router.post("/", async (req, res) => {
  const { trainee_name, position_id, evaluation } = req.body;

  // Get weights
  const weightsRes = await pool.query(
    "SELECT skill_id, weight FROM position_skills WHERE position_id = $1",
    [position_id]
  );

  const weights = {};
  weightsRes.rows.forEach(row => {
    weights[row.skill_id] = row.weight;
  });

  // Calculate score
  const score = calculateScore(evaluation, weights);

  // Save evaluation
  const evalRes = await pool.query(
    "INSERT INTO evaluations (trainee_name, position_id, score) VALUES ($1, $2, $3) RETURNING id",
    [trainee_name, position_id, score]
  );

  const evaluationId = evalRes.rows[0].id;

  // Save details
  for (let skillId in evaluation) {
    await pool.query(
      "INSERT INTO evaluation_details (evaluation_id, skill_id, value) VALUES ($1, $2, $3)",
      [evaluationId, skillId, evaluation[skillId]]
    );
  }

  res.json({ score });
});

// Get all evaluations
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.trainee_name, e.score, p.name AS position
      FROM evaluations e
      JOIN positions p ON e.position_id = p.id
      ORDER BY e.score DESC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching evaluations" });
  }
});
module.exports = router;