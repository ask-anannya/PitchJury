import * as pdfjs from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Use stable public-path worker to avoid Vite ?url import issues in production
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

export interface ExtractionResult {
  text: string;
  isOcr: boolean;
  pageCount: number;
}

export interface ProgressCallback {
  (progress: number, message: string): void;
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: ProgressCallback
): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument(arrayBuffer);
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
}
