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
        c.name AS category_name
      FROM public.skills s
      JOIN public.categories c ON s.category_id = c.id
      ORDER BY c.id ASC, s.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ SQL ERROR:", err.message);
    res.status(500).json({ error: "Database join failed" });
  }
});

// ✅ 3. SAVE INDIVIDUAL SKILL WEIGHTS
router.post("/:id/weights", async (req, res) => {
  const positionId = req.params.id;
  const weights = req.body; 

  try {
    // ✅ MERGED: Strict Validation for weights
    for (const [skillId, weightValue] of Object.entries(weights)) {
      // Since weights are stored as decimals (0.50), we multiply by 100 to check 0-100 range
      const checkValue = weightValue * 100;
      if (weightValue < 0 || weightValue > 1) {
        return res.status(400).json({ error: "Skill weights must be between 0% and 100%." });
      }
    }

    await pool.query("BEGIN");

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

// ✅ 4. SAVE GLOBAL CATEGORY WEIGHTS
router.post("/:id/category-weights", async (req, res) => {
  const positionId = req.params.id;
  const { categoryWeights } = req.body; 

  try {
    // ✅ MERGED: Strict Validation for category weights
    for (const [catId, weightValue] of Object.entries(categoryWeights)) {
      if (weightValue < 0 || weightValue > 1) {
        return res.status(400).json({ error: "Category impact must be between 0% and 100%." });
      }
    }

    await pool.query("BEGIN");

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
router.get("/:id/weights", async (req, res) => {
  const { id } = req.params;
  try {
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