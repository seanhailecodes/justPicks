import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Team name mapping: Full name -> Code
const TEAM_NAME_TO_CODE: Record<string, string> = {
  "Arizona Cardinals": "ARI",
  "Atlanta Falcons": "ATL",
  "Baltimore Ravens": "BAL",
  "Buffalo Bills": "BUF",
  "Carolina Panthers": "CAR",
  "Chicago Bears": "CHI",
  "Cincinnati Bengals": "CIN",
  "Cleveland Browns": "CLE",
  "Dallas Cowboys": "DAL",
  "Denver Broncos": "DEN",
  "Detroit Lions": "DET",
  "Green Bay Packers": "GB",
  "Houston Texans": "HOU",
  "Indianapolis Colts": "IND",
  "Jacksonville Jaguars": "JAX",
  "Kansas City Chiefs": "KC",
  "Las Vegas Raiders": "LV",
  "Los Angeles Chargers": "LAC",
  "Los Angeles Rams": "LAR",
  "Miami Dolphins": "MIA",
  "Minnesota Vikings": "MIN",
  "New England Patriots": "NE",
  "New Orleans Saints": "NO",
  "New York Giants": "NYG",
  "New York Jets": "NYJ",
  "Philadelphia Eagles": "PHI",
  "Pittsburgh Steelers": "PIT",
  "San Francisco 49ers": "SF",
  "Seattle Seahawks": "SEA",
  "Tampa Bay Buccaneers": "TB",
  "Tennessee Titans": "TEN",
  "Washington Commanders": "WAS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const oddsApiKey = Deno.env.get("ODDS_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch completed games from The Odds API (last 3 days)
    const scoresUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=${oddsApiKey}&daysFrom=3`;
    
    console.log("Fetching NFL scores from The Odds API...");
    const scoresResponse = await fetch(scoresUrl);
    
    if (!scoresResponse.ok) {
      throw new Error(`Odds API error: ${scoresResponse.status}`);
    }

    const scoresData = await scoresResponse.json();
    console.log(`Found ${scoresData.length} games from API`);

    // Filter to only completed games
    const completedGames = scoresData.filter((game: any) => game.completed === true && game.scores);
    console.log(`${completedGames.length} completed games with scores`);

    // Build lookup map: team codes -> scores
    const scoresMap = new Map<string, { homeScore: number; awayScore: number; homeTeam: string; awayTeam: string }>();
    
    for (const game of completedGames) {
      const homeCode = TEAM_NAME_TO_CODE[game.home_team];
      const awayCode = TEAM_NAME_TO_CODE[game.away_team];
      
      if (!homeCode || !awayCode) continue;
      
      const homeScoreData = game.scores.find((s: any) => s.name === game.home_team);
      const awayScoreData = game.scores.find((s: any) => s.name === game.away_team);
      
      if (!homeScoreData || !awayScoreData) continue;
      
      // Key by both team codes for lookup
      const key = `${awayCode}_${homeCode}`;
      scoresMap.set(key, {
        homeScore: parseInt(homeScoreData.score),
        awayScore: parseInt(awayScoreData.score),
        homeTeam: homeCode,
        awayTeam: awayCode
      });
    }

    console.log(`Built scores map with ${scoresMap.size} games`);

    // STEP 1: Update any games that need scores
    const { data: unresolvedGames, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("league", "NFL")
      .is("home_score", null);

    if (gamesError) throw gamesError;

    let gamesResolved = 0;

    for (const dbGame of unresolvedGames || []) {
      // Extract team codes from game
      const homeCode = dbGame.home_team_code || dbGame.home_team;
      const awayCode = dbGame.away_team_code || dbGame.away_team;
      const key = `${awayCode}_${homeCode}`;
      
      const scores = scoresMap.get(key);
      if (!scores) {
        console.log(`No score found for: ${awayCode} @ ${homeCode}`);
        continue;
      }

      const homeSpread = parseFloat(dbGame.home_spread) || 0;
      const homeWithSpread = scores.homeScore + homeSpread;
      const totalPoints = scores.homeScore + scores.awayScore;
      const overUnderLine = parseFloat(dbGame.over_under_line) || null;

      // Calculate spread result
      let homeCovered: boolean | null = null;
      let awayCovered: boolean | null = null;
      let spreadPush = false;

      if (homeWithSpread > scores.awayScore) {
        homeCovered = true;
        awayCovered = false;
      } else if (homeWithSpread < scores.awayScore) {
        homeCovered = false;
        awayCovered = true;
      } else {
        spreadPush = true;
      }

      // Calculate over/under
      let wentOver: boolean | null = null;
      let totalPush = false;

      if (overUnderLine) {
        if (totalPoints > overUnderLine) {
          wentOver = true;
        } else if (totalPoints < overUnderLine) {
          wentOver = false;
        } else {
          totalPush = true;
        }
      }

      console.log(`Updating game: ${awayCode} ${scores.awayScore} @ ${homeCode} ${scores.homeScore}`);

      const { error: updateError } = await supabase
        .from("games")
        .update({
          home_score: scores.homeScore,
          away_score: scores.awayScore,
          game_status: "final",
          locked: true,
          home_covered: homeCovered,
          away_covered: awayCovered,
          spread_push: spreadPush,
          went_over: wentOver,
          total_push: totalPush,
          actual_total: totalPoints,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", dbGame.id);

      if (!updateError) gamesResolved++;
    }

    // STEP 2: Grade ALL ungraded picks for games that have scores
    // This catches any picks that weren't graded before
    const { data: ungradedPicks, error: picksError } = await supabase
      .from("picks")
      .select("*, games!inner(id, home_score, away_score, home_spread, over_under_line, game_status)")
      .is("correct", null)
      .not("games.home_score", "is", null);

    if (picksError) {
      console.error("Error fetching ungraded picks:", picksError);
    }

    console.log(`Found ${ungradedPicks?.length || 0} ungraded picks to process`);

    let picksResolved = 0;

    for (const pick of ungradedPicks || []) {
      const game = pick.games;
      if (!game || game.home_score === null) continue;

      const homeSpread = parseFloat(game.home_spread) || 0;
      const homeWithSpread = game.home_score + homeSpread;
      const totalPoints = game.home_score + game.away_score;
      const overUnderLine = parseFloat(game.over_under_line) || null;

      // Determine spread result
      let homeCovered: boolean | null = null;
      let awayCovered: boolean | null = null;
      let spreadPush = false;

      if (homeWithSpread > game.away_score) {
        homeCovered = true;
        awayCovered = false;
      } else if (homeWithSpread < game.away_score) {
        homeCovered = false;
        awayCovered = true;
      } else {
        spreadPush = true;
      }

      // Grade spread pick
      let spreadCorrect: boolean | null = null;
      if (pick.pick === "home" || pick.pick === "away") {
        if (spreadPush) {
          spreadCorrect = null;
        } else if (pick.pick === "home") {
          spreadCorrect = homeCovered;
        } else {
          spreadCorrect = awayCovered;
        }
      }

      // Grade over/under pick
      let ouCorrect: boolean | null = null;
      if (pick.over_under_pick === "over" || pick.over_under_pick === "under") {
        if (overUnderLine) {
          const totalPush = totalPoints === overUnderLine;
          if (totalPush) {
            ouCorrect = null;
          } else if (pick.over_under_pick === "over") {
            ouCorrect = totalPoints > overUnderLine;
          } else {
            ouCorrect = totalPoints < overUnderLine;
          }
        }
      }

      const { error: pickUpdateError } = await supabase
        .from("picks")
        .update({
          correct: spreadCorrect,
          over_under_correct: ouCorrect,
        })
        .eq("id", pick.id);

      if (!pickUpdateError) {
        picksResolved++;
        console.log(`Graded pick ${pick.id}: spread=${spreadCorrect}, o/u=${ouCorrect}`);
      } else {
        console.error(`Error grading pick ${pick.id}:`, pickUpdateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        gamesResolved,
        picksResolved,
        message: `Resolved ${gamesResolved} games and ${picksResolved} picks`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});