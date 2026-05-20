import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Use a .js extension to avoid MIME-type issues with .mjs in some hosting environments
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

export interface ExtractionResult {
  text: string;
  isOcr: boolean;
  pageCount: number;
  error?: string;
}

export interface ProgressCallback {
  (progress: number, message: string): void;
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: ProgressCallback
): Promise<ExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // pdfjs-dist v4 expects a Uint8Array inside the data option
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';
    let needsOcr = false;
    let worker: any = null;

    for (let i = 1; i <= numPages; i++) {
      onProgress?.((i / numPages) * 0.5, `Processing page ${i} of ${numPages}...`);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      if (pageText.trim().length > 0) {
        fullText += pageText + '\n\n';
      } else {
        needsOcr = true;
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        onProgress?.(0.5 + (i / numPages) * 0.5, `Performing OCR on page ${i}...`);

        if (!worker) {
          worker = await createWorker('eng');
        }
        const { data: { text } } = await worker.recognize(canvas);

        fullText += text + '\n\n';
      }
    }

    if (worker) {
      await worker.terminate();
    }

    return {
      text: fullText.trim(),
      isOcr: needsOcr,
      pageCount: numPages,
    };
  } catch (err: any) {
    // Return the error so the UI can show a helpful fallback
    return {
      text: '',
      isOcr: false,
      pageCount: 0,
      error: err?.message || String(err),
    };
  }
}
