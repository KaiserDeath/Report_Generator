require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- DEBUG: Check if Key is Loading ---
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing from .env file!");
} else {
  console.log("✅ GEMINI_API_KEY detected.");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

router.post("/", async (req, res) => {
  try {
    const { trainee_name, position_id, evaluation } = req.body;

    // 1. Fetch Weights and Metadata
    const data = await pool.query(`
      SELECT ps.skill_id, ps.weight AS skill_internal_weight, pcw.weight AS cat_global_weight, 
             c.name AS category_name, p.name AS position_name
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
    const categories = {};
    let finalGeneralScore = 0;

    // 2. Calculation Logic
    data.rows.forEach(row => {
      const traineeRating = evaluation[row.skill_id] || 0;
      const skillContribution = traineeRating * row.skill_internal_weight;
      if (!categories[row.category_name]) {
        categories[row.category_name] = { score: 0, weight: Number(row.cat_global_weight) };
      }
      categories[row.category_name].score += skillContribution;
    });

    const categoryBreakdown = {};
    Object.keys(categories).forEach(cat => {
      categoryBreakdown[cat] = Number(categories[cat].score.toFixed(2));
      finalGeneralScore += (categories[cat].score * categories[cat].weight);
    });

    const finalScoreNum = Number(finalGeneralScore.toFixed(2));

    // 3. AI Generation (MERGED & OPTIMIZED)
    let aiFeedback = "Feedback unavailable.";
    
    try {
      // ✅ Using gemini-2.5-flash-lite as confirmed by your check_models.js
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: "You are a professional corporate trainer. Your feedback is always exactly 3 sentences long, supportive, and strictly follows the data provided. Structure: Sentence 1 identifies a strength, Sentence 2 identifies a growth area, Sentence 3 provides a brief encouraging closing.",
      });

      // ✅ Merged generationConfig for maximum speed
      const generationConfig = {
        maxOutputTokens: 250,
        temperature: 0.1, // Lower temperature = faster and more consistent
        topP: 0.95,
      };
      
      const prompt = `
        Provide a professional evaluation for ${trainee_name} for the ${posName} position. 
        Total Score: ${finalScoreNum}%. 
        Category Performance: ${JSON.stringify(categoryBreakdown)}.
      `;

      // Trigger generation with optimized config
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig
      });
      
      const response = await result.response;
      const text = response.text(); 
      
      if (text) {
        aiFeedback = text.trim();
        console.log(`✅ AI successfully generated report for ${trainee_name}`);
      }
    } catch (aiErr) {
      console.error("❌ Gemini API Detail Error:", aiErr.message);
      // Fallback message if Quota is hit again
      aiFeedback = "AI assessment currently unavailable due to high traffic. Scores have been saved.";
    }

    // 4. Save to PostgreSQL
    const savedEval = await pool.query(
      `INSERT INTO public.evaluations (trainee_name, position_id, score, category_breakdown, ai_feedback) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [trainee_name, position_id, finalScoreNum, JSON.stringify(categoryBreakdown), aiFeedback]
    );

    // 5. Send Response back to Frontend
    res.json({
      id: savedEval.rows[0].id,
      generalEvaluation: finalScoreNum,
      categoryBreakdown,
      aiFeedback 
    });

  } catch (err) {
    console.error("Global Route Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET route for History
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, p.name AS position_name FROM public.evaluations e
      JOIN public.positions p ON e.position_id = p.id 
      ORDER BY e.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Error:", err.message);
    res.status(500).json({ error: "Error fetching history" });
  }
});

module.exports = router;