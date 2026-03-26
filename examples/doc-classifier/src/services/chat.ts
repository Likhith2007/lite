import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const key = process.env.GEMINI_API_KEY || '';
console.log(`GEMINI_API_KEY length: ${key.length}`);
const genAI = new GoogleGenerativeAI(key);
const modelName = 'gemini-flash-latest';
console.log(`Initializing model: ${modelName}`);
const model = genAI.getGenerativeModel({ 
  model: modelName,
  generationConfig: {
    maxOutputTokens: 2048,
  }
});

export async function askQuestion(message: string, context: string) {
  console.log(`Asking question: "${message}" with context length: ${context.length}`);
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in chat service!");
  }

  const prompt = `You are a helpful, professional AI Legal Assistant analyzing a legal or financial document.
Here is the critical context of the document (extracted via OCR and an initial AI pass):
---
${context.substring(0, 15000)}
---

The user has asked the following question about this document:
"${message}"

Please answer the user's question concisely based primarily on the provided document context. If the answer is not in the document, politely say so. Do not invent information. Format the response cleanly.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err: any) {
    console.error("Gemini API Error in askQuestion:", err);
    try {
      fs.writeFileSync('c:/Users/ilikh/liteparse/examples/doc-classifier/debug_chat_error.json', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch(e) {}
    throw err;
  }
}
