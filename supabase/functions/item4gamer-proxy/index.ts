import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ITEM4GAMER_BASE = "https://item4gamer.com/wp-json/reseller/v1";

// ─── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Auth validation ───────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const bearerToken = authHeader.replace("Bearer ", "").trim();
    const isValidRequest =
      bearerToken === supabaseAnonKey ||
      bearerToken === supabaseServiceKey ||
      (bearerToken.split(".").length === 3 && bearerToken.length > 20);

    if (!isValidRequest) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Get API Key from env (NO fallback — must be set) ──────────────────
    const apiKey = Deno.env.get("ITEM4GAMER_API_KEY");
    
    if (!apiKey || apiKey.trim().length < 10) {
      console.error("[item4gamer-proxy] ITEM4GAMER_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error: ITEM4GAMER_API_KEY not set",
          hint: "Set the secret using: supabase secrets set ITEM4GAMER_API_KEY=your_key"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ─── Parse request body ────────────────────────────────────────────────
    let body: { 
      endpoint?: string; 
      params?: Record<string, string | number>; 
      method?: string; 
      orderBody?: unknown 
    };
    
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { endpoint, params = {}, method = "GET", orderBody } = body;

    if (!endpoint) {
      return new Response(JSON.stringify({ error: "Missing endpoint" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Build request ─────────────────────────────────────────────────────
    const url = new URL(`${ITEM4GAMER_BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const i4gHeaders: Record<string, string> = {
      "api-key": apiKey.trim(),
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const fetchOptions: RequestInit = {
      method: method as string,
      headers: i4gHeaders,
    };

    if (method === "POST" && orderBody) {
      fetchOptions.body = JSON.stringify(orderBody);
    }

    console.log(`[item4gamer-proxy] ${method} ${url.toString()}`);
    console.log(`[item4gamer-proxy] Headers:`, JSON.stringify(i4gHeaders, null, 2));

    // ─── Make request to Item4Gamer ────────────────────────────────────────
    const response = await fetch(url.toString(), fetchOptions);
    const responseText = await response.text();

    console.log(`[item4gamer-proxy] Status: ${response.status}, Length: ${responseText.length}`);
    console.log(`[item4gamer-proxy] Response: ${responseText.slice(0, 500)}`);

    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[item4gamer-proxy] API error: ${response.status} — ${responseText.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ 
          error: `Item4Gamer API error: ${response.status}`,
          details: responseText.slice(0, 500),
          debug: {
            endpointUsed: endpoint,
            apiKeyLength: apiKey.length,
            apiKeyFirst4: apiKey.slice(0, 4) + "****"
          }
        }),
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
    console.error("[item4gamer-proxy] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: `Item4Gamer proxy error: ${(err as Error).message}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
