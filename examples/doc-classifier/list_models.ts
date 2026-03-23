import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
  try {
    const models = await genAI.listModels();
    for (const m of (models as any)) {
      console.log(m.name, m.supportedGenerationMethods);
    }
  } catch (e: any) {
    console.error("LIST MODELS FAILED:", e.message);
  }
}
run();
