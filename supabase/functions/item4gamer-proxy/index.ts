import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ITEM4GAMER_BASE = "https://item4gamer.com/wp-json/reseller/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ITEM4GAMER_API_KEY") || "DEMO_API_KEY";
    const body = await req.json();
    const { endpoint, params = {}, method = "GET", orderBody } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build URL with query params
    const url = new URL(`${ITEM4GAMER_BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const headers: Record<string, string> = {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method === "POST" && orderBody) {
      fetchOptions.body = JSON.stringify(orderBody);
    }

    console.log(`[item4gamer-proxy] ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), fetchOptions);
    const responseText = await response.text();

    console.log(`[item4gamer-proxy] Status: ${response.status}`);

    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Item4Gamer: ${response.status} ${responseText.slice(0, 200)}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[item4gamer-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: `Item4Gamer proxy error: ${(err as Error).message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
