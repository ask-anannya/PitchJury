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
    onProgress?.(10, "Uploading PDF...");

    const arrayBuffer = await file.arrayBuffer();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`;
    const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    onProgress?.(30, "Extracting text...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: arrayBuffer,
    });

    onProgress?.(80, "Processing response...");

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Server error ${response.status}: ${errText || response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      return {
        text: "",
        isOcr: false,
        pageCount: 0,
        error: data.error,
      };
    }

    onProgress?.(100, "Extraction complete");

    return {
      text: data.text || "",
      isOcr: data.isOcr || false,
      pageCount: data.pageCount || 0,
    };
  } catch (err: any) {
    return {
      text: "",
      isOcr: false,
      pageCount: 0,
      error: err?.message || String(err),
    };
  }
}
