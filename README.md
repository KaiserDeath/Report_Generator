# 🚀 TrainerHub AI: Evaluation & Report Generator

**TrainerHub AI** is a professional full-stack platform designed for corporate trainers to streamline the evaluation process. It leverages Google Gemini AI for automated performance insights and Puppeteer for high-fidelity PDF report generation.

---

## 🛠️ Tech Stack

* **Frontend:** [React.js](https://reactjs.org/) (Vite), [Tailwind CSS](https://tailwindcss.com/), [React Router](https://reactrouter.com/)
* **Backend:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) (Configurable for MongoDB)
* **AI Engine:** [Google Gemini 1.5](https://ai.google.dev/) (with multi-model fallback)
* **PDF Engine:** [Puppeteer](https://pptr.dev/) (Headless Chrome)
* **Deployment:** [Vercel](https://vercel.app/) (Frontend) & [Render](https://render.com/) (Backend)

---

## ✨ Key Features

* **Weighted Scoring Engine:** Calculates final grades based on custom-weighted skill categories.
* **AI-Powered Feedback:** Automatically generates a professional 3-sentence summary (Strength, Growth, and Summary) for every evaluation.
* **Resilient AI Logic:** Multi-model fallback system ensures reports are generated even if specific AI models are rate-limited.
* **Professional PDF Export:** High-DPI, print-ready PDF generation that captures formal report layouts perfectly.
* **History & Management:** Full CRUD operations to track, update trainer notes, or delete past evaluations.

---

## 🧮 Score Calculation Methodology

The system utilizes a **double-weighted hierarchical algorithm** to ensure critical skills and high-priority categories influence the final grade accurately.

### 1. Weighted Skill Average (Category Level)
Each skill within a category has an internal weight ($w$). We first calculate the weighted points for the category:

$$\text{Category Score} = \sum (\text{Trainee Rating} \times \text{Skill Weight})$$

### 2. Global Category Weighting (Final Grade)
Different categories carry different "Global Weights" ($W$) toward the final percentage.

$$\text{Final Grade} = \sum (\text{Category Score} \times \text{Category Global Weight})$$

---

## 📦 Installation & Setup

### 1. Environment Variables
Create a `.env` file in the `/backend` directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_google_ai_key
FRONTEND_URL=[https://your-app.vercel.app](https://your-app.vercel.app)

---

### 2. Backend Setup
cd backend
npm install
# Build command installs Chrome for Puppeteer on Linux servers
npm run build 
npm start

### 3. Frontend Setup
cd frontend
npm install
npm run dev

---

🚀 Deployment Configuration
Vercel (Frontend)
To support React Router's SPA routing, a vercel.json is required in the root:

JSON
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}

---

Render (Backend)
To ensure Puppeteer functions in a Linux environment:

Build Command: npm install && npx puppeteer browsers install chrome

Environment Variable: Add PUPPETEER_CACHE_DIR = ./.cache/puppeteer

Config: Include a .puppeteerrc.cjs file to keep the browser binary persistent.

---

🚦 API Reference
Method,Endpoint,Function
POST,/evaluations,"Triggers score logic, AI feedback, and DB save."
GET,/evaluations/:id/pdf,Generates and streams a professional PDF.
GET,/evaluations,Retrieves full evaluation history.
PATCH,/evaluations/:id/notes,Updates manual trainer observations.
DELETE,/evaluations/:id,Permanently removes a report.

---

🧪 AI Resiliency System
The backend includes a generateWithFallback helper. If a high-tier model like gemini-1.5-pro is unavailable, the system automatically attempts the request using gemini-1.5-flash and others to ensure zero downtime for report generation.

📝 License
Distributed under the MIT License. See LICENSE for more information.

Developed with ❤️ by [KaiserDeath]
