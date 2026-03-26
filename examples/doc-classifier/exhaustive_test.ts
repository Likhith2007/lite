import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test(name: string) {
  try {
    const model = genAI.getGenerativeModel({ model: name });
    const result = await model.generateContent("test");
    console.log(`SUCCESS [${name}]:`, result.response.text().substring(0, 20));
  } catch (e: any) {
    console.log(`FAILED [${name}]:`, e.message);
  }
}

async function run() {
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-pro'
  ];
  console.log("Starting model exhaustion test...");
  for (const m of models) {
    await test(m);
  }
  console.log("Test complete.");
}
run();
