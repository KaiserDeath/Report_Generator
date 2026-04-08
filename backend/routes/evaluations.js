require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * ✅ CREATE Evaluation (POST /evaluations)
 */
router.post("/", async (req, res) => {
  try {
    const { 
      trainee_name, 
      position_id, 
      evaluation, 
      training_start, 
      training_end 
    } = req.body;

    // 1. Strict Backend Validation
    if (!evaluation || typeof evaluation !== 'object') {
      return res.status(400).json({ error: "Invalid evaluation format." });
    }

    const skillIds = Object.keys(evaluation);
    for (const id of skillIds) {
      const score = evaluation[id];
      if (score !== null && score !== undefined) {
        if (!Number.isInteger(Number(score)) || score < 0 || score > 100) {
          return res.status(400).json({ 
            error: `Invalid score for skill ID ${id}. Must be an integer between 0 and 100.` 
          });
        }
      }
    }

    // 2. Fetch Position Weights and Metadata (Includes s.name for the report)
    const data = await pool.query(`
      SELECT 
        ps.skill_id, 
        s.name AS skill_name, 
        ps.weight AS skill_internal_weight, 
        pcw.weight AS cat_global_weight, 
        c.name AS category_name, 
        p.name AS position_name
      FROM public.position_skills ps
      JOIN public.skills s ON ps.skill_id = s.id
      JOIN public.categories c ON s.category_id = c.id
      JOIN public.positions p ON ps.position_id = p.id
      JOIN public.position_category_weights pcw ON (pcw.category_id = c.id AND pcw.position_id = ps.position_id)
      WHERE ps.position_id = $1
    `, [position_id]);

    if (data.rows.length === 0) {
      return res.status(404).json({ error: "Position configuration not found" });
    }

    const posName = data.rows[0].position_name;
    
    // 3. Advanced Calculation Logic (Building the nested object for Frontend)
    const categoryBreakdown = {};
    let finalGeneralScore = 0;

    data.rows.forEach(row => {
      const traineeRating = evaluation[row.skill_id] || 0;
      
      // Initialize category if not exists
      if (!categoryBreakdown[row.category_name]) {
        categoryBreakdown[row.category_name] = {
          category_avg: 0,
          total_weighted_points: 0,
          weight: Number(row.cat_global_weight),
          skills: [] 
        };
      }

      // Add individual skill detail to the breakdown
      categoryBreakdown[row.category_name].skills.push({
        skill_name: row.skill_name,
        score: (traineeRating / 20).toFixed(1) // Converts 100% scale to 5.0 scale for display
      });

      // Add to the category's running weighted total
      categoryBreakdown[row.category_name].total_weighted_points += (traineeRating * row.skill_internal_weight);
    });

    // Finalize category averages and the final overall score
    Object.keys(categoryBreakdown).forEach(cat => {
      const catData = categoryBreakdown[cat];
      // This is the score for the category (0-100)
      catData.category_avg = Number(catData.total_weighted_points.toFixed(2));
      // Apply the global category weight to the final general score
      finalGeneralScore += (catData.category_avg * catData.weight);
    });

    const finalScoreNum = Number(finalGeneralScore.toFixed(2));

    // 4. --- GEMINI AI GENERATION ---
    let aiFeedback = "Feedback unavailable.";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
      const prompt = `
        You are a professional corporate trainer. Provide feedback for ${trainee_name} 
        applying for the position of ${posName}.
        Data for evaluation:
        - Overall Performance: ${finalScoreNum}%
        - Category Scores: ${JSON.stringify(categoryBreakdown)}
        Your response must be EXACTLY 3 sentences long:
        1. State a clear strength.
        2. State a clear area for development.
        3. Provide a brief objective summary for hiring managers.
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.2 },
      });

      const response = await result.response;
      aiFeedback = response.text().trim() || aiFeedback;
    } catch (aiErr) {
      aiFeedback = "AI Feedback timed out or quota exceeded. Please review the scores manually.";
    }

    // 5. Save to PostgreSQL
    const savedEval = await pool.query(
      `INSERT INTO public.evaluations (
        trainee_name, position_id, score, category_breakdown, 
        ai_feedback, training_start, training_end
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [
        trainee_name, 
        position_id, 
        finalScoreNum, 
        JSON.stringify(categoryBreakdown), // Now contains the skills array!
        aiFeedback,
        training_start, 
        training_end    
      ]
    );

    res.json({
      id: savedEval.rows[0].id,
      generalEvaluation: finalScoreNum,
      categoryBreakdown,
      aiFeedback 
    });

  } catch (err) {
    console.error("❌ POST Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * ✅ UPDATE Trainer Notes (PATCH /evaluations/:id/notes)
 */
router.patch("/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body; 
  try {
    const result = await pool.query(
      "UPDATE public.evaluations SET trainer_notes = $1 WHERE id = $2 RETURNING id",
      [notes, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Evaluation not found." });
    res.json({ message: "Trainer notes saved successfully" });
  } catch (err) {
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
});

/**
 * ✅ GET Evaluation History (GET /evaluations)
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, p.name AS position_name FROM public.evaluations e
      JOIN public.positions p ON e.position_id = p.id 
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching history" });
  }
});

/**
 * ✅ DELETE Evaluation (DELETE /evaluations/:id)
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM public.evaluations WHERE id = $1", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Report not found" });
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete report" });
  }
});

module.exports = router;