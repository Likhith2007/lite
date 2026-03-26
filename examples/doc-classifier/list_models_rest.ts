import * as dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach((m: any) => console.log(`- ${m.name}`));
    } else {
      console.log("API ERROR:", JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.log("FETCH FAILED:", e.message);
  }
}

listModels();
