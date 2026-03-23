import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY || '';
console.log('KEY USED:', key.length, key.substring(0,4), key.substring(key.length-4));
const genAI = new GoogleGenerativeAI(key);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent("hi");
    console.log("SUCCESS:", result.response.text().substring(0, 20));
  } catch (e: any) {
    console.error("FULL ERROR:", e.message);
  }
}

test();
