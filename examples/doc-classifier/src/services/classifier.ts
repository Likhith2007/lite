import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ 
  model: 'gemini-flash-latest',
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
    let textContent = parsedData.text;
    
    // Heuristics for failed OCR:
    const alphanumericCount = (textContent.match(/[a-zA-Z0-9]/g) || []).length;
    const alphanumericRatio = textContent.length > 0 ? alphanumericCount / textContent.length : 0;
    
    const isOcrFailed = (!textContent || textContent.trim() === '' || textContent.length < 50 || alphanumericRatio < 0.5);

    // 2. Classify with Gemini
    const basePrompt = `You are an expert document analyst and classifier. 
Classify the provided document into exactly one of these predefined categories:
- Identity Proofs (e.g., Aadhaar, PAN, Passport, ID Cards)
- Financial Documents (e.g., Bank Statements, Invoices, Receipts, Tax Returns)
- Legal Agreements & Contracts
- Compliance & Regulatory Documents
- Business Registration & Corporate Documents
- Presentations, Pitch Decks & Marketing Material
- Academic, Reports & Project Proposals
- Personal Documents (e.g., Letters, Notes, Resumes)
- Technical Documentation & Manuals
- Unknown (if it doesn't fit the above)

You must return ONLY a JSON response matching this exact structure:
{
  "category": "category name",
  "confidence": <number between 0 and 100>,
  "summary": "A 2-3 sentence overview of the document contents",
  "clauses": ["Key point, obligation, or highlight 1", "Key point 2"],
  "risks": ["Potential risk, red flag, or warning 1", "Potential risk 2 (if any)"]
}`;

    const path = await import('path');
    const fileExt = path.extname(filePath).toLowerCase();
    
    let mimeType: string | null = null;
    if (['.jpg', '.jpeg'].includes(fileExt)) mimeType = 'image/jpeg';
    else if (fileExt === '.png') mimeType = 'image/png';
    else if (fileExt === '.webp') mimeType = 'image/webp';
    else if (fileExt === '.pdf') mimeType = 'application/pdf';

    const promptWithText = basePrompt + `\n\nExtracted Text (may be garbled if OCR quality is poor):\n---\n${textContent.substring(0, 15000)}\n---`;

    let result;
    if (mimeType) {
      // Gemini 2.5 supports native vision for these formats, so we ALWAYS pass the file natively
      // to let Gemini's internal multimodal engine override any bad local OCR!
      console.log(`Passing ${mimeType} file natively to Gemini alongside text.`);
      const fileData = await fs.readFile(filePath);
      const filePart = {
        inlineData: {
          data: fileData.toString('base64'),
          mimeType
        }
      };
      
      const modifiedPrompt = promptWithText + "\n\nPlease heavily rely on the visually attached document if the extracted text above seems garbled or incoherent.";
      result = await model.generateContent([modifiedPrompt, filePart]);
    } else {
      // Unrecognized format for Native Vision, pray the extracted text is good enough
      console.log("Passing only extracted text to Gemini");
      result = await model.generateContent(promptWithText);
    }
    
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
