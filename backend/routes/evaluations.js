require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../db");
const puppeteer = require("puppeteer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * 🤖 HELPER: Smart AI Model Switcher
 * Attempts a prioritized list of models in case one is offline or overloaded.
 */
async function generateWithFallback(prompt, config) {
  const modelWishlist = [
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-pro-latest',
    'gemini-flash-latest'
  ];

  let lastError;

  for (const modelName of modelWishlist) {
    try {
      console.log(`🤖 Attempting AI with: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: config,
      });

      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.warn(`⚠️ ${modelName} failed: ${err.message}`);
      lastError = err;
      // Continue to next model in wishlist
    }
  }
  // If we exhaust the list, throw the last caught error
  throw lastError;
}

/**
 * ✅ MERGED & IMPROVED: GENERATE PDF (GET /evaluations/:id/pdf)
 * Captures specifically the "formal-report-paper" view from the frontend.
 */
router.get("/:id/pdf", async (req, res) => {
  let browser;
  try {
    const { id } = req.params;

    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Listen for console messages and errors from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('error', err => console.error('PAGE ERROR:', err));
    page.on('pageerror', err => console.error('PAGE CRASH:', err));

    // Set viewport to a standard desktop size for high-quality capture
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Target the specific "Printable" route on your frontend
    const targetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/report-print/${id}`;

    console.log(`📡 Puppeteer is navigating to: ${targetUrl}`);

    // 1. Navigate to the page
    await page.goto(targetUrl, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 60000
    });

    // 2. CRITICAL: Wait for the formal-report-paper to exist in the DOM.
    try {
      await page.waitForSelector('.formal-report-paper', { timeout: 20000 });
    } catch (timeoutErr) {
      console.error("❌ CSS Selector '.formal-report-paper' not found.");
      throw new Error("Report paper element not found on the page.");
    }

    // 3. Optional: Small delay to ensure any CSS animations/badges are finished
    await new Promise(r => setTimeout(r, 500));

    // 4. Generate the PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Crucial for showing badges and blue headers
      preferCSSPageSize: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Report_${id}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    if (browser) await browser.close();
    console.error("❌ PDF Generation Error:", err.message);
    console.error("Full error stack:", err.stack);
    res.status(500).json({ error: `PDF Generation failed: ${err.message}` });
  }
});

/**
 * ✅ GET Single Evaluation (GET /evaluations/:id)
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT e.*, p.name AS position_name 
       FROM public.evaluations e
       JOIN public.positions p ON e.position_id = p.id 
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error fetching evaluation" });
  }
});

/**
 * ✅ CREATE Evaluation (POST /evaluations)
 */
router.post("/", async (req, res) => {
  try {
    const { 
      trainee_name, 
      trainer_name,
      position_id, 
      evaluation, 
      training_start, 
      training_end 
    } = req.body;

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
    const categoryBreakdown = {};
    let finalGeneralScore = 0;

    data.rows.forEach(row => {
      const traineeRating = evaluation[row.skill_id] || 0;
      if (!categoryBreakdown[row.category_name]) {
        categoryBreakdown[row.category_name] = {
          category_avg: 0,
          total_weighted_points: 0,
          weight: Number(row.cat_global_weight),
          skills: [] 
        };
      }
      categoryBreakdown[row.category_name].skills.push({
        skill_name: row.skill_name,
        score: (traineeRating / 20).toFixed(1)
      });
      categoryBreakdown[row.category_name].total_weighted_points += (traineeRating * row.skill_internal_weight);
    });

    Object.keys(categoryBreakdown).forEach(cat => {
      const catData = categoryBreakdown[cat];
      catData.category_avg = Number(catData.total_weighted_points.toFixed(2));
      finalGeneralScore += (catData.category_avg * catData.weight);
    });

    const finalScoreNum = Number(finalGeneralScore.toFixed(2));

    let aiFeedback = "Feedback unavailable.";
    try {
      const prompt = `
        You are a professional corporate trainer. Provide feedback for ${trainee_name} 
        applying for the position of ${posName}.
        Data for evaluation:
        - Overall Performance: ${finalScoreNum}%
        - Category Scores: ${JSON.stringify(categoryBreakdown)}
        Your response must be EXACTLY 3 sentences long:
        1. State a clear strength based on the highest-scoring data point.
        2. State a clear area for development, identifying the most critical performance gap.
        3. Provide a brief objective summary for hiring agents regarding the candidate's current readiness for the role.
      `;

      // Optimized with Fallback Logic
      aiFeedback = await generateWithFallback(prompt, { 
        maxOutputTokens: 250, 
        temperature: 0.2 
      });

    } catch (aiErr) {
      console.error("❌ AI Fallback Failure:", aiErr.message);
      aiFeedback = "AI Feedback timed out or quota exceeded. Please review the scores manually.";
    }

    const savedEval = await pool.query(
      `INSERT INTO public.evaluations (
        trainee_name, trainer_name, position_id, score, category_breakdown, 
        ai_feedback, training_start, training_end
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
      [
        trainee_name, trainer_name, position_id, finalScoreNum, 
        JSON.stringify(categoryBreakdown), aiFeedback,
        training_start, training_end    
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