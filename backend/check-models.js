const dotenv = require('dotenv');
dotenv.config();

async function listGeminiModels() {
    const API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    console.log("🔍 Checking connection and fetching Gemini models...");

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            return;
        }

        // Format the data for a clean table
        const modelTable = data.models.map(m => {
            return {
                ID: m.name.split('/')[1], // cleaner view
                Version: m.version,
                Chat: m.supportedGenerationMethods.includes('generateContent') ? "✅" : "❌",
                InputTokenLimit: m.inputTokenLimit
            };
        });

        console.table(modelTable);
        console.log("\n✅ Connection Successful! Use the ID in your 'getGenerativeModel' call.");

    } catch (err) {
        console.error("❌ Network Error: Could not reach Gemini API.", err.message);
    }
}

listGeminiModels();