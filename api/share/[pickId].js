/**
 * Vercel Serverless Function: /api/share/[pickId]
 *
 * Purpose: Serve server-rendered HTML with OG meta tags for social crawlers.
 * Facebook's facebookexternalhit bot doesn't execute JS, so OG tags injected
 * by React are invisible to it. This function fetches pick data from Supabase
 * and returns a full HTML page with OG tags baked in, making share previews work.
 *
 * Routing: vercel.json rewrites /share/:pickId → /api/share/:pickId
 */

export default async function handler(req, res) {
  const { pickId } = req.query;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(buildHtml({
      title: 'justPicks',
      description: 'Track picks. No money. Just bragging rights.',
      pickId,
      error: true,
    }));
  }

  try {
    // Fetch pick + game + profile via Supabase REST API
    const apiUrl =
      `${supabaseUrl}/rest/v1/picks` +
      `?id=eq.${encodeURIComponent(pickId)}` +
      `&select=id,pick,team_picked,bet_type,over_under_pick,correct,user_id,` +
      `games(home_team,away_team,home_team_code,away_team_code,home_spread,away_spread,over_under_line,home_score,away_score,game_date,league),` +
      `profiles(display_name,username)`;

    const response = await fetch(apiUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    const rows = await response.json();
    const data = rows?.[0];

    if (!data) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(buildHtml({
        title: 'Pick not found · justPicks',
        description: 'This pick may have been removed.',
        pickId,
        error: true,
      }));
    }

    const game = data.games;
    const profile = data.profiles;
    const pickerName = profile?.display_name || profile?.username || 'A friend';

    // Build human-readable pick label (mirrors the React app logic)
    let pickLabel = '';
    if (data.bet_type === 'total' || data.over_under_pick) {
      const line = game?.over_under_line;
      const side = data.over_under_pick === 'over' ? 'Over' : 'Under';
      pickLabel = line != null ? `${side} ${line}` : side;
    } else {
      const teamCode =
        data.team_picked === 'home'
          ? game?.home_team_code || game?.home_team
          : game?.away_team_code || game?.away_team;
      const spreadVal =
        data.team_picked === 'home' ? game?.home_spread : game?.away_spread;
      const spreadStr =
        spreadVal != null
          ? ` ${parseFloat(spreadVal) > 0 ? '+' : ''}${parseFloat(spreadVal)}`
          : '';
      pickLabel = `${teamCode || ''}${spreadStr}`.trim();
    }

    const awayCode = game?.away_team_code || game?.away_team || '?';
    const homeCode = game?.home_team_code || game?.home_team || '?';
    const gameTitle = `${awayCode} @ ${homeCode}`;

    const emoji =
      data.correct === true ? '✅' : data.correct === false ? '❌' : '⏳';
    const resultText =
      data.correct === true ? 'Won' : data.correct === false ? 'Lost' : 'Pending';

    const hasScore =
      game?.home_score != null && game?.away_score != null;
    const scoreText = hasScore
      ? ` · ${awayCode} ${game.away_score}–${homeCode} ${game.home_score}`
      : '';

    const league = game?.league || '';
    const leagueEmoji =
      { NBA: '🏀', NFL: '🏈', NHL: '🏒', NCAAB: '🎓', Soccer: '⚽' }[league] || '🏆';

    const ogTitle = `${emoji} ${pickerName} picked ${pickLabel}`;
    const ogDescription = `${gameTitle}${scoreText} · ${resultText} · justPicks`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.send(
      buildHtml({
        title: ogTitle,
        description: ogDescription,
        pickId,
        pickLabel,
        pickerName,
        gameTitle,
        resultText,
        emoji,
        leagueEmoji,
        league,
        scoreText,
        hasScore,
        awayTeam: game?.away_team || '',
        homeTeam: game?.home_team || '',
        awayScore: game?.away_score,
        homeScore: game?.home_score,
        resultColor:
          data.correct === true
            ? '#34C759'
            : data.correct === false
            ? '#FF3B30'
            : '#8E8E93',
      })
    );
  } catch (err) {
    console.error('[share-og] Error:', err);
    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(
      buildHtml({
        title: 'justPicks',
        description: 'Track picks. No money. Just bragging rights.',
        pickId,
        error: true,
      })
    );
  }
}

// ---------------------------------------------------------------------------
// HTML builder
// ---------------------------------------------------------------------------

function esc(str) {
  // Escape HTML entities to prevent XSS in injected values
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml({
  title,
  description,
  pickId,
  pickLabel,
  pickerName,
  gameTitle,
  resultText,
  emoji,
  leagueEmoji,
  league,
  scoreText,
  hasScore,
  awayTeam,
  homeTeam,
  awayScore,
  homeScore,
  resultColor = '#8E8E93',
  error = false,
}) {
  const shareUrl = `https://justpicks.app/share/${encodeURIComponent(pickId)}`;
  const appUrl = 'https://justpicks.app';

  // Card content varies between error state and normal state
  const cardContent = error
    ? `
      <div style="font-size:48px;margin-bottom:12px;">🤷</div>
      <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;">Pick not found</div>
      <div style="color:#8E8E93;font-size:14px;margin-bottom:24px;">This pick may have been removed.</div>
    `
    : `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <span style="background:#1C1C1E;border-radius:8px;padding:4px 10px;color:#8E8E93;font-size:12px;font-weight:600;">${esc(leagueEmoji)} ${esc(league)}</span>
        <span style="border-radius:8px;border:1px solid ${esc(resultColor)};padding:4px 10px;color:${esc(resultColor)};font-size:12px;font-weight:700;background:${esc(resultColor)}22;">${esc(emoji)} ${esc(resultText?.toUpperCase())}</span>
      </div>
      <div style="color:#636366;font-size:13px;margin-bottom:4px;">${esc(pickerName)} picked</div>
      <div style="color:#fff;font-size:34px;font-weight:900;letter-spacing:0.5px;margin-bottom:6px;">${esc(pickLabel)}</div>
      <div style="color:#8E8E93;font-size:15px;font-weight:500;margin-bottom:${hasScore ? '12px' : '0'};">${esc(gameTitle)}</div>
      ${hasScore
        ? `<div style="background:#1C1C1E;border-radius:8px;padding:8px 12px;text-align:center;color:#EBEBF5;font-size:13px;font-weight:600;">Final: ${esc(awayTeam)} ${esc(awayScore)}–${esc(homeTeam)} ${esc(homeScore)}</div>`
        : ''}
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(shareUrl)}" />
  <meta property="og:site_name" content="justPicks" />
  <meta property="og:type" content="website" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:site" content="@justPicksApp" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .wrap { width: 100%; max-width: 360px; }
    .logo {
      color: #FF6B35;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 1px;
      text-align: center;
      margin-bottom: 24px;
    }
    .card {
      background: #111;
      border-radius: 20px;
      padding: 28px;
      border: 1px solid #2C2C2E;
      margin-bottom: 16px;
    }
    .cta {
      display: block;
      width: 100%;
      background: #FF6B35;
      color: #fff;
      text-align: center;
      padding: 16px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
      margin-bottom: 10px;
    }
    .tagline {
      color: #3A3A3C;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="logo">justPicks</div>
    <div class="card">
      ${cardContent}
    </div>
    <a class="cta" href="${esc(appUrl)}">Make Your Own Picks →</a>
    <p class="tagline">Track picks. No money. Just bragging rights.</p>
  </div>
</body>
</html>`;
}
