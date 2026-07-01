import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action, share_token, invited_email, order_amount } = body;

    // ── Action: track sign-up ────────────────────────────────────────────────
    if (action === 'signup') {
      if (!share_token || !invited_email) {
        return new Response(
          JSON.stringify({ error: 'Missing share_token or invited_email' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find referral code row
      const { data: referralRow, error: findErr } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', share_token)
        .single();

      if (findErr || !referralRow) {
        console.log('[track-referral] Code not found:', share_token);
        return new Response(
          JSON.stringify({ success: false, message: 'Referral code not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Avoid duplicate invite tracking
      const { data: existing } = await supabase
        .from('referral_invites')
        .select('id')
        .eq('referrer_email', referralRow.user_email)
        .eq('invited_email', invited_email)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ success: true, message: 'Already tracked' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert invite record
      await supabase.from('referral_invites').insert({
        referrer_email: referralRow.user_email,
        invited_email,
        status: 'signed_up',
        orders_count: 0,
        total_spent: 0,
      });

      // Increment users_invited on referral_codes
      await supabase
        .from('referral_codes')
        .update({ users_invited: (referralRow.users_invited || 0) + 1 })
        .eq('code', share_token);

      console.log('[track-referral] signup tracked:', invited_email, '←', referralRow.user_email);
      return new Response(
        JSON.stringify({ success: true, message: 'Signup tracked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Action: track order ──────────────────────────────────────────────────
    if (action === 'order') {
      if (!invited_email || !order_amount) {
        return new Response(
          JSON.stringify({ error: 'Missing invited_email or order_amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find invite record for this user
      const { data: invite } = await supabase
        .from('referral_invites')
        .select('*')
        .eq('invited_email', invited_email)
        .single();

      if (!invite) {
        return new Response(
          JSON.stringify({ success: false, message: 'No invite record found for this user' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newOrdersCount = (invite.orders_count || 0) + 1;
      const newTotalSpent = parseFloat(invite.total_spent || 0) + parseFloat(order_amount);

      // Update invite record
      await supabase
        .from('referral_invites')
        .update({
          orders_count: newOrdersCount,
          total_spent: newTotalSpent,
          status: 'ordered',
        })
        .eq('id', invite.id);

      // Update referral_codes aggregate: orders_completed + total_spending
      const { data: referralRow } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_email', invite.referrer_email)
        .single();

      if (referralRow) {
        await supabase
          .from('referral_codes')
          .update({
            orders_completed: (referralRow.orders_completed || 0) + 1,
            total_spending: parseFloat(referralRow.total_spending || 0) + parseFloat(order_amount),
          })
          .eq('user_email', invite.referrer_email);
      }

      console.log('[track-referral] order tracked:', invited_email, 'amount:', order_amount);
      return new Response(
        JSON.stringify({ success: true, message: 'Order tracked' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action. Use "signup" or "order".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('[track-referral] Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
