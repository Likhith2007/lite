import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function runTest() {
  const models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("test");
      console.log(`SUCCESS for ${m}: ${result.response.text().substring(0, 10)}...`);
    } catch (e: any) {
      console.log(`FAILED for ${m}: ${e.message}`);
    }
  }
}

runTest();
