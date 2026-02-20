import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export async function importPdfJs() {
  // Dynamic import of PDF.js
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // From dist/src/engines/pdf/ we need to go up to dist/src/vendor/pdfjs
  const PDFJS_DIR = join(__dirname, "../../vendor/pdfjs");

  // Import PDF.js dynamically
  await import(`${PDFJS_DIR}/pdf.mjs`);
  const pdfjs = await import(`${PDFJS_DIR}/pdf.mjs`);
  const { getDocument } = pdfjs;

  return { fn: getDocument, dir: PDFJS_DIR };
}
