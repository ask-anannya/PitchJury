import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// @ts-ignore — pdfjs-dist Node build works in Deno without worker issues
import * as pdfjs from "npm:pdfjs-dist@4.10.38";

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  try {
    const arrayBuffer = await req.arrayBuffer();

    if (arrayBuffer.byteLength === 0) {
      return jsonResponse({ error: "Empty PDF file" }, 400);
    }

    const uint8Array = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = "";
    let hasText = false;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");

      if (pageText.trim().length > 0) {
        hasText = true;
        fullText += pageText + "\n\n";
      }
    }

    return jsonResponse({
      text: fullText.trim(),
      pageCount: numPages,
      isOcr: false,
      hasText,
    });
  } catch (err: any) {
    console.error("PDF extraction error:", err);
    return jsonResponse({
      error: err?.message || "Failed to extract text from PDF",
      text: "",
      pageCount: 0,
      isOcr: false,
      hasText: false,
    }, 500);
  }
});