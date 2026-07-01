/**
 * banner-ai — Analyze a banner image URL and generate a catchy title + subtitle/badge
 * using OnSpace AI (Gemini 3 Flash) vision capabilities.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: "image_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ONSPACE_AI_API_KEY");
    const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");

    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: "OnSpace AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are a creative marketing copywriter for NoxyStore, a gaming top-up marketplace.
Analyze this banner image and generate:
1. A short, punchy, engaging TITLE (max 8 words) — something exciting for gamers (e.g. "Summer Sale — Up to 30% Off", "Mobile Legends Diamonds Back in Stock", "Flash Deal: Free Fire Diamonds")
2. A short BADGE/SUBTITLE (max 4 words, all caps) — like a label or category tag (e.g. "LIMITED TIME", "HOT DEAL", "NEW ARRIVAL", "FLASH SALE")

Consider what the image shows — game artwork, promotional colors, gaming theme — and make the copy relevant and exciting.

Respond in this exact JSON format only (no markdown, no extra text):
{"title": "Your Generated Title Here", "subtitle": "BADGE TEXT"}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[banner-ai] AI API error:", errText);
      return new Response(
        JSON.stringify({ error: `AI API error: ${errText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    console.log("[banner-ai] Raw AI response:", content);

    // Parse JSON from AI response
    let title = "";
    let subtitle = "";
    try {
      // Extract JSON — strip any markdown fences if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        title = parsed.title || "";
        subtitle = parsed.subtitle || "";
      }
    } catch (e) {
      console.error("[banner-ai] JSON parse error:", e);
      // Fallback: try to extract manually
      const titleMatch = content.match(/"title":\s*"([^"]+)"/);
      const subtitleMatch = content.match(/"subtitle":\s*"([^"]+)"/);
      title = titleMatch?.[1] || "Gaming Top-Up Special Offer";
      subtitle = subtitleMatch?.[1] || "EXCLUSIVE DEAL";
    }

    return new Response(
      JSON.stringify({ title, subtitle }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[banner-ai] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
