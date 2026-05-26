import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { share_token, product_id } = await req.json();

    if (!share_token || !product_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse share_token format: {userId}_{productId}_{timestamp}
    const [referrerId] = share_token.split('_');

    // Check if referral already exists for this token
    const { data: existingReferral } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('share_token', share_token)
      .single();

    if (existingReferral) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Referral already tracked',
          referral: existingReferral 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new referral tracking entry
    const { data: referral, error } = await supabase
      .from('referral_tracking')
      .insert({
        referrer_id: referrerId,
        share_token,
        product_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Referral tracked successfully',
        referral 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Track referral error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
