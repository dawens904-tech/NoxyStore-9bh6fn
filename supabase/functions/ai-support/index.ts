
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

  const { messages, userEmail, sessionId } = await req.json();

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

  const systemPrompt = `You are NoxyStore AI Support, a helpful assistant for NoxyStore.com — a professional gaming top-up platform powered by Lootbar.

User email: ${userEmail || "Guest"}

User's recent orders (last 7 days):
${ordersContext}

Your role:
- Help users with their orders and top-up questions
- Provide order status information from the context above
- Answer questions about top-up delivery, refunds, and game-specific issues
- Be friendly, professional, and concise
- Always respond in the same language the user writes in
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
