import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("ONSPACE_AI_API_KEY");
  const baseUrl = Deno.env.get("ONSPACE_AI_BASE_URL");
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { messages, userEmail, sessionId, suggestMode, agentMode } = await req.json();

  // ── suggestMode: generate 5 quick reply options for admin, do NOT save to DB ──
  if (suggestMode) {
    // Fetch user's recent orders for context
    let ordersContext = "No orders found for this user.";
    if (userEmail) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("reference_id, game_name, sku_name, price, state, created_at")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(5);

      if (orders && orders.length > 0) {
        const stateMap: Record<number, string> = {
          1: "In Transaction", 2: "Success", 3: "Failed",
          4: "Settlement", 5: "Partially Successful", 6: "Cancelled"
        };
        ordersContext = orders.map((o) =>
          `- ${o.game_name} (${o.sku_name}) | $${o.price} | Status: ${stateMap[o.state] || "Unknown"} | Ref: ${o.reference_id}`
        ).join("\n");
      }
    }

    const suggestPrompt = `You are a NoxyStore customer support admin assistant. 

NoxyStore is a gaming top-up platform.

User email: ${userEmail || "Guest"}
User's recent orders:
${ordersContext}

Based on the conversation below, generate exactly 5 short, helpful customer support reply options the admin can send.
Each reply should be on its own line, numbered 1-5. Do NOT include any other text or explanation.
Replies should be professional, friendly, and directly address the user's last message.
Vary the tone and content across the 5 options — short/long, direct/empathetic, etc.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: suggestPrompt },
          ...messages,
          { role: "user", content: "Generate 5 reply options for me as the admin." }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    // Parse numbered list
    const lines = raw
      .split("\n")
      .map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((l: string) => l.length > 0)
      .slice(0, 5);

    return new Response(JSON.stringify({ suggestions: lines }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Normal / agentMode: generate a single reply and save to DB ─────────────

  // Check if a real admin is in the session — if so, skip AI auto-reply
  if (!agentMode && sessionId) {
    const { data: session } = await supabaseAdmin
      .from("chat_sessions")
      .select("status, admin_email")
      .eq("id", sessionId)
      .single();

    if (session?.status === "live" && session?.admin_email) {
      console.log(`[ai-support] Session ${sessionId} has live admin — skipping AI reply.`);
      return new Response(JSON.stringify({ skipped: true, reason: "Admin is live in session" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Fetch user's recent orders for context
  let ordersContext = "No orders found for this user.";
  if (userEmail) {
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("reference_id, game_name, sku_name, price, state, created_at, extra_info")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(7);

    if (orders && orders.length > 0) {
      const stateMap: Record<number, string> = {
        1: "In Transaction", 2: "Success", 3: "Failed",
        4: "Settlement", 5: "Partially Successful", 6: "Cancelled"
      };
      ordersContext = orders.map((o) =>
        `- ${o.game_name} (${o.sku_name}) | $${o.price} | Status: ${stateMap[o.state] || "Unknown"} | Ref: ${o.reference_id} | Date: ${new Date(o.created_at).toLocaleDateString()}`
      ).join("\n");
    }
  }

  const systemPrompt = agentMode
    ? `You are a NoxyStore VIP human support agent who has just joined the chat. 
Greet the user warmly and let them know you've reviewed the conversation so far.
Offer to help resolve their issue immediately.
Be friendly, professional, and concise.
User email: ${userEmail || "Guest"}
User's recent orders:
${ordersContext}`
    : `You are NoxyStore AI Support, a helpful assistant for NoxyStore.com — a professional gaming top-up platform powered by Lootbar.

User email: ${userEmail || "Guest"}

User's recent orders (last 7):
${ordersContext}

Your role:
- Help users with their orders and top-up questions
- Provide order status information from the context above when the user asks about their order
- Answer questions about top-up delivery, refunds, and game-specific issues
- Be friendly, professional, and concise
- Always respond in the same language the user writes in
- Do NOT proactively mention order reference IDs or internal IDs — only share them if the user explicitly asks
- Do NOT reveal internal system details or admin credentials

Common answers:
- Top-up usually takes 3-5 minutes, up to 30 min during peak hours
- If order failed, it means the game account info was incorrect or Lootbar service issue
- Refunds are processed within 3-5 business days
- For urgent issues, users can escalate to VIP human support

Keep responses short and helpful.`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't process your request. Please try again.";

  // Save AI message to DB
  if (sessionId) {
    await supabaseAdmin.from("chat_messages").insert({
      session_id: sessionId,
      user_email: userEmail,
      sender: "ai",
      content: reply,
    });
  }

  return new Response(JSON.stringify({ reply }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
