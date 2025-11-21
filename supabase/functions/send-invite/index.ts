import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inviteeEmail, groupName, inviterName, groupId, inviteId } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'justPicks <onboarding@resend.dev>',
        to: [inviteeEmail],
        subject: `You've been invited to join ${groupName} on justPicks!`,
        html: `
          <h2>You've been invited!</h2>
          <p>${inviterName} has invited you to join their group "${groupName}" on justPicks.</p>
          <p>Click the link below to accept the invitation:</p>
          <a href="justpicks://accept-invite/${inviteId}" style="background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Accept Invitation</a>
          <p>Or copy and paste this link: justpicks://accept-invite/${inviteId}</p>
          <p>This invitation expires in 7 days.</p>
        `,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})