import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  /** Send to a specific user (resolve notifications) */
  userId?: string
  /** Send to all subscribed users (broadcast) */
  broadcast?: boolean
  title: string
  body: string
  /** Deep-link URL opened on tap */
  url?: string
  tag?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
    const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@dontbet.online'

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('VAPID keys not configured')
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const payload: PushPayload = await req.json()
    const { userId, broadcast, title, body, url = '/', tag = 'dontbet' } = payload

    if (!userId && !broadcast) {
      throw new Error('Provide userId or broadcast: true')
    }

    // Fetch target subscriptions
    let query = supabase.from('push_subscriptions').select('*')
    if (userId) query = query.eq('user_id', userId)

    const { data: subs, error: fetchError } = await query
    if (fetchError) throw fetchError
    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const message = JSON.stringify({ title, body, url, tag })
    let sent = 0
    const expired: string[] = []

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            message
          )
          sent++
        } catch (err: any) {
          // 410 Gone / 404 = subscription expired, clean up
          if (err.statusCode === 410 || err.statusCode === 404) {
            expired.push(sub.id)
          } else {
            console.error(`Push failed for ${sub.endpoint}:`, err.message)
          }
        }
      })
    )

    // Remove expired subscriptions
    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expired)
      console.log(`Removed ${expired.length} expired subscriptions`)
    }

    return new Response(
      JSON.stringify({ success: true, sent, expired: expired.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
