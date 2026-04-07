const express = require("express");
const router = express.Router();
const pool = require("../db");

// ✅ 1. Get all positions (For dropdown menus)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM public.positions ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET POSITIONS ERROR:", err.message);
    res.status(500).json({ error: "Error fetching positions" });
  }
});

// ✅ 2. Get ALL possible skills (For the Admin weighting setup)
router.get("/skills/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        s.category_id, 
        c.name AS category_name  -- <--- THIS IS THE MISSING LINK
      FROM public.skills s
      JOIN public.categories c ON s.category_id = c.id
      ORDER BY c.id ASC, s.name ASC
    `);
    
    console.log("Sending to Frontend:", result.rows); // Check your terminal!
    res.json(result.rows);
  } catch (err) {
    console.error("❌ SQL ERROR:", err.message);
    res.status(500).json({ error: "Database join failed" });
  }
});

// ✅ 3. SAVE INDIVIDUAL SKILL WEIGHTS (e.g., English = 0.50 within Soft Skills)
router.post("/:id/weights", async (req, res) => {
  const positionId = req.params.id;
  const weights = req.body; // { "skill_id": 0.20, "skill_id_2": 0.80 }

  try {
    await pool.query("BEGIN");

    // Clear old skill weights for this position
    await pool.query(
      "DELETE FROM public.position_skills WHERE position_id = $1",
      [positionId]
    );

    const skillEntries = Object.entries(weights);
    for (const [skillId, weightValue] of skillEntries) {
      if (weightValue > 0) {
        await pool.query(
          "INSERT INTO public.position_skills (position_id, skill_id, weight) VALUES ($1, $2, $3)",
          [positionId, skillId, weightValue]
        );
      }
    }

    await pool.query("COMMIT");
    res.json({ message: "Skill weights saved successfully." });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ SAVE SKILL WEIGHTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to save skill weights" });
  }
});

// ✅ 4. SAVE GLOBAL CATEGORY WEIGHTS (e.g., Soft Skills = 0.40 for Bilingual)
// This handles the Bilingual (40/35/25) vs Operations (27/33/40) logic
router.post("/:id/category-weights", async (req, res) => {
  const positionId = req.params.id;
  const { categoryWeights } = req.body; // { "cat_id_1": 0.40, "cat_id_2": 0.35 }

  try {
    await pool.query("BEGIN");

    // Clear old category weights for this position
    await pool.query(
      "DELETE FROM public.position_category_weights WHERE position_id = $1",
      [positionId]
    );

    for (const [catId, weightValue] of Object.entries(categoryWeights)) {
      await pool.query(
        "INSERT INTO public.position_category_weights (position_id, category_id, weight) VALUES ($1, $2, $3)",
        [positionId, catId, weightValue]
      );
    }

    await pool.query("COMMIT");
    res.json({ message: "Global category weights saved successfully." });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ SAVE CAT WEIGHTS ERROR:", err.message);
    res.status(500).json({ error: "Failed to save category weights" });
  }
});

// ✅ 5. GET SKILLS + WEIGHTS + CAT WEIGHTS for a specific position
// Used by TraineeForm and Admin to see current setup
router.get("/:id/weights", async (req, res) => {
  const { id } = req.params;
  try {
    // This query pulls the skills and their internal weights, 
    // PLUS the global weight of the category they belong to
    const result = await pool.query(`
      SELECT 
        s.id, 
        s.name, 
        c.name AS category_name, 
        c.id AS category_id,
        ps.weight AS weight,
        pcw.weight AS cat_global_weight
      FROM public.position_skills ps
      JOIN public.skills s ON ps.skill_id = s.id
      JOIN public.categories c ON s.category_id = c.id
      LEFT JOIN public.position_category_weights pcw 
        ON (pcw.category_id = c.id AND pcw.position_id = ps.position_id)
      WHERE ps.position_id = $1
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("❌ FETCH WEIGHTS ERROR:", err.message);
    res.status(500).json({ error: "Error fetching existing weights" });
  }
});

module.exports = router;