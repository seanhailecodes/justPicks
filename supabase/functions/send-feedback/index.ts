import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { category, message, userEmail, userId } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'justPicks <noreply@justpicks.app>',
        to: ['seanhaile@identitysimpler.com'],
        subject: `[justPicks Feedback] ${category}`,
        html: `
          <h2>New Feedback Submitted</h2>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="border-left: 3px solid #FF6B35; margin: 0; padding-left: 16px; color: #333;">
            ${message.replace(/\n/g, '<br/>')}
          </blockquote>
          <hr/>
          <p style="color: #888; font-size: 12px;">
            From user: ${userEmail || 'unknown'} (${userId || 'anonymous'})
          </p>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Resend error: ${error}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-feedback error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
