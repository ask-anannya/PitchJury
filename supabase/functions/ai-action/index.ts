import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_URL = "https://app-bn2wrjsgz11d-api-VaOwP8E7dJqa.gateway.appmedo.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";
const UPSTREAM_TIMEOUT_MS = 120_000;

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

  let body: { prompt?: string; systemPrompt?: string; userPrompt?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const prompt = body.prompt || body.systemPrompt || body.userPrompt;
  if (!prompt) {
    return jsonResponse({ error: "Missing prompt" }, 400);
  }

  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "Server configuration error: INTEGRATIONS_API_KEY not set" }, 500);
  }

  // Manual timeout via AbortController for Deno compatibility
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (upstream.status === 429 || upstream.status === 402) {
      const errText = await upstream.text();
      return jsonResponse({ error: `Rate limit or billing error: ${errText}`, status: upstream.status }, upstream.status);
    }

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      return jsonResponse(
        { error: `Upstream error: ${upstream.status}`, details: errText },
        502
      );
    }

    // Collect full streaming response
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;

        try {
          const frame = JSON.parse(dataStr);
          const text = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) fullText += text;
        } catch {
          // skip incomplete frame
        }
      }
    }

    // Also process any remaining buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data:")) {
        const dataStr = line.slice(5).trim();
        if (dataStr && dataStr !== "[DONE]") {
          try {
            const frame = JSON.parse(dataStr);
            const text = frame?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) fullText += text;
          } catch {
            // skip
          }
        }
      }
    }

    return jsonResponse({ text: fullText });
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    if (controller.signal.aborted) {
      return jsonResponse({ error: "Request timed out after 120 seconds" }, 504);
    }
    return jsonResponse({ error: msg }, 500);
  }
});
