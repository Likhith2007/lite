import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json'
  }
});

let parser: any = null;

export async function processDocument(filePath: string) {
  const startTime = Date.now();

  if (!parser) {
    const { LiteParse } = await import('../../../../dist/src/lib.js');
    parser = new LiteParse();
  }

  try {
    // 1. Extract text using LiteParse
    const parsedData = await parser.parse(filePath);
    const textContent = parsedData.text;

    if (!textContent || textContent.trim() === '') {
      throw new Error('Could not extract text from document');
    }

    // 2. Classify with Gemini
    const systemPrompt = `You are an expert document classifier. 
Based on the extracted text below, classify the document into exactly one of these predefined categories:
- Identity Proofs (e.g., Aadhaar, PAN, Passport)
- Financial Documents (e.g., Bank Statements, Invoices, Receipts)
- Legal Agreements
- Compliance Documents
- Tax Documents
- Business Registration Documents
- Presentations / Pitch Decks
- Academic / Project Proposals
- Unknown (if it doesn't fit the above)

You must return ONLY a JSON response matching this exact structure:
{
  "category": "category name",
  "confidence": <number between 0 and 100>,
  "summary": "A 2-3 sentence overview of the document contents",
  "clauses": ["Key point/clause 1", "Key point/clause 2"],
  "risks": ["Potential risk or red flag 1", "Potential risk 2 (if any)"]
}

Extracted Text:
---
${textContent.substring(0, 15000)}
---`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    let classification;
    try {
        classification = JSON.parse(responseText);
    } catch(e) {
        classification = { category: 'Unknown', confidence: 0, summary: "Could not parse document correctly.", clauses: [], risks: [] };
    }

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      documentType: classification.category,
      confidenceScore: `${classification.confidence}%`,
      processingTime: `${processingTime} sec`,
      summary: classification.summary || "No summary available.",
      clauses: classification.clauses || [],
      risks: classification.risks || []
    };
  } finally {
     // Clean up temporary file
     try {
         await fs.unlink(filePath);
     } catch(e) { /* ignore cleanup error */ }
  }
}
