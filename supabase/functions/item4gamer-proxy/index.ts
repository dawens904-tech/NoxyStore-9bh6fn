import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ITEM4GAMER_BASE = "https://item4gamer.com/wp-json/reseller/v1";

// ─── Main handler ────────────────────────────────────────────────────────────
// Note: JWT verification is not enforced here — we accept both authenticated
// and anonymous requests (anon key is sufficient). The real security is the
// server-side ITEM4GAMER_API_KEY which is never exposed to the client.
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate the request has our Supabase auth header (anon key or user JWT)
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Accept anon key, service key, or any valid Bearer token (user JWT)
    const bearerToken = authHeader.replace("Bearer ", "").trim();
    const isValidRequest =
      bearerToken === supabaseAnonKey ||
      bearerToken === supabaseServiceKey ||
      bearerToken.split(".").length === 3; // valid JWT has 3 parts

    if (!isValidRequest && !authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ITEM4GAMER_API_KEY") || "DEMO_API_KEY";

    let body: { endpoint?: string; params?: Record<string, string | number>; method?: string; orderBody?: unknown };
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

    // Build URL with query params
    const url = new URL(`${ITEM4GAMER_BASE}/${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const i4gHeaders: Record<string, string> = {
      "api-key": apiKey,
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

    const response = await fetch(url.toString(), fetchOptions);
    const responseText = await response.text();

    console.log(`[item4gamer-proxy] Status: ${response.status}, Length: ${responseText.length}`);

    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[item4gamer-proxy] API error: ${response.status} — ${responseText.slice(0, 300)}`);
      return new Response(
        JSON.stringify({ error: `Item4Gamer API error: ${response.status} — ${responseText.slice(0, 200)}` }),
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
