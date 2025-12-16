import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Fetch completed NCAAB games from The Odds API (last 3 days)
    const scoresUrl = `https://api.the-odds-api.com/v4/sports/basketball_ncaab/scores/?apiKey=${oddsApiKey}&daysFrom=3`;
    
    console.log("Fetching NCAAB scores from The Odds API...");
    const scoresResponse = await fetch(scoresUrl);
    
    if (!scoresResponse.ok) {
      throw new Error(`Odds API error: ${scoresResponse.status}`);
    }

    const scoresData = await scoresResponse.json();
    console.log(`Found ${scoresData.length} games from API`);

    // Filter to only completed games
    const completedGames = scoresData.filter((game: any) => game.completed === true && game.scores);
    console.log(`${completedGames.length} completed games with scores`);

    // Build lookup map: team names -> scores
    const scoresMap = new Map<string, { homeScore: number; awayScore: number; homeTeam: string; awayTeam: string }>();
    
    for (const game of completedGames) {
      const homeScoreData = game.scores.find((s: any) => s.name === game.home_team);
      const awayScoreData = game.scores.find((s: any) => s.name === game.away_team);
      
      if (!homeScoreData || !awayScoreData) continue;
      
      // Key by full team names since NCAAB doesn't have standard codes
      const key = `${game.away_team}|${game.home_team}`;
      scoresMap.set(key, {
        homeScore: parseInt(homeScoreData.score),
        awayScore: parseInt(awayScoreData.score),
        homeTeam: game.home_team,
        awayTeam: game.away_team
      });
    }

    console.log(`Built scores map with ${scoresMap.size} games`);

    // STEP 1: Update any games that need scores
    const { data: unresolvedGames, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("league", "NCAAB")
      .is("home_score", null);

    if (gamesError) throw gamesError;

    let gamesResolved = 0;

    for (const dbGame of unresolvedGames || []) {
      // Look up by full team names
      const key = `${dbGame.away_team}|${dbGame.home_team}`;
      const scores = scoresMap.get(key);
      
      if (!scores) {
        console.log(`No score found for: ${dbGame.away_team} @ ${dbGame.home_team}`);
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

      console.log(`Updating game: ${dbGame.away_team} ${scores.awayScore} @ ${dbGame.home_team} ${scores.homeScore}`);

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

    // STEP 2: Get all NCAAB games with scores (to grade picks)
    const { data: resolvedGames, error: resolvedGamesError } = await supabase
      .from("games")
      .select("*")
      .eq("league", "NCAAB")
      .not("home_score", "is", null);

    if (resolvedGamesError) throw resolvedGamesError;

    // Build a map of game data for quick lookup
    const gamesMap = new Map<string, any>();
    for (const game of resolvedGames || []) {
      gamesMap.set(game.id, game);
    }

    console.log(`Found ${gamesMap.size} resolved NCAAB games in database`);

    // STEP 3: Get all ungraded picks for NCAAB games
    const ncaabGameIds = Array.from(gamesMap.keys());
    
    if (ncaabGameIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          gamesResolved,
          picksResolved: 0,
          message: `Resolved ${gamesResolved} games and 0 picks`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: ungradedPicks, error: picksError } = await supabase
      .from("picks")
      .select("*")
      .in("game_id", ncaabGameIds)
      .is("correct", null);

    if (picksError) {
      console.error("Error fetching ungraded picks:", picksError);
      throw picksError;
    }

    console.log(`Found ${ungradedPicks?.length || 0} ungraded NCAAB picks to process`);

    let picksResolved = 0;

    for (const pick of ungradedPicks || []) {
      const game = gamesMap.get(pick.game_id);
      
      if (!game || game.home_score === null) {
        continue;
      }

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