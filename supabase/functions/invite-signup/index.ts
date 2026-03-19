import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADJECTIVES = [
  'Swift', 'Bold', 'Sharp', 'Slick', 'Lucky', 'Gritty', 'Clutch', 'Solid',
  'Sneaky', 'Crafty', 'Fierce', 'Calm', 'Wild', 'Cool', 'Smooth', 'Scrappy',
  'Hungry', 'Savvy', 'Fearless', 'Sly', 'Tough', 'Witty', 'Stealth', 'Prime',
]

const NOUNS = [
  'Picker', 'Hawk', 'Wolf', 'Fox', 'Bear', 'Shark', 'Eagle', 'Raven',
  'Cobra', 'Titan', 'Ghost', 'Viper', 'Lynx', 'Panda', 'Falcon', 'Otter',
  'Badger', 'Mamba', 'Rhino', 'Bison', 'Jaguar', 'Moose', 'Panther', 'Mustang',
]

function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 9000) + 1000 // 4-digit number
  return `${adj}${noun}${num}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, acceptedTermsAt, acceptedTermsVersion } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const username = generateUsername()

    // Create user with email pre-confirmed — invite is the trust signal
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        accepted_terms_at: acceptedTermsAt || new Date().toISOString(),
        accepted_terms_version: acceptedTermsVersion || '2026-03-08',
        username,
      },
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Insert profile row with generated username
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: data.user.id,
        username,
        display_name: username,
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      console.error('Profile insert failed:', profileError.message)
      // Non-fatal — user still created, they can set name later
    }

    return new Response(
      JSON.stringify({ user: { id: data.user.id, email: data.user.email, username } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
