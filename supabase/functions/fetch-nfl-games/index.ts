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

    // Get unresolved NFL games from database
    const { data: unresolvedGames, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("league", "NFL")
      .eq("game_status", "pending")
      .not("home_spread", "is", null);

    if (gamesError) {
      throw gamesError;
    }

    console.log(`Found ${unresolvedGames?.length || 0} unresolved games in database`);

    let gamesResolved = 0;
    let picksResolved = 0;

    for (const dbGame of unresolvedGames || []) {
      // Find matching game from API using team codes
      const apiGame = completedGames.find((ag: any) => {
        const apiHomeCode = TEAM_NAME_TO_CODE[ag.home_team];
        const apiAwayCode = TEAM_NAME_TO_CODE[ag.away_team];
        
        return (
          (dbGame.home_team === apiHomeCode || dbGame.home_team === ag.home_team) &&
          (dbGame.away_team === apiAwayCode || dbGame.away_team === ag.away_team)
        );
      });

      if (!apiGame) {
        console.log(`No score found for: ${dbGame.away_team} @ ${dbGame.home_team}`);
        continue;
      }

      // Extract scores
      const homeScoreData = apiGame.scores.find((s: any) => s.name === apiGame.home_team);
      const awayScoreData = apiGame.scores.find((s: any) => s.name === apiGame.away_team);

      if (!homeScoreData || !awayScoreData) {
        console.log(`Missing score data for: ${dbGame.away_team} @ ${dbGame.home_team}`);
        continue;
      }

      const homeScore = parseInt(homeScoreData.score);
      const awayScore = parseInt(awayScoreData.score);

      console.log(`Resolving: ${dbGame.away_team} ${awayScore} @ ${dbGame.home_team} ${homeScore}`);

      // Calculate spread result
      const homeSpread = dbGame.home_spread;
      const homeWithSpread = homeScore + homeSpread;
      
      let homeCovered: boolean | null = null;
      let awayCovered: boolean | null = null;
      let spreadPush = false;

      if (homeWithSpread > awayScore) {
        homeCovered = true;
        awayCovered = false;
      } else if (homeWithSpread < awayScore) {
        homeCovered = false;
        awayCovered = true;
      } else {
        spreadPush = true;
      }

      // Calculate over/under result
      const totalPoints = homeScore + awayScore;
      const overUnderLine = dbGame.over_under_line;
      
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

      // Update game in database
      const { error: updateError } = await supabase
        .from("games")
        .update({
          home_score: homeScore,
          away_score: awayScore,
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

      if (updateError) {
        console.error(`Error updating game ${dbGame.id}:`, updateError);
        continue;
      }

      gamesResolved++;

      // Now resolve picks for this game
      const { data: picks, error: picksError } = await supabase
        .from("picks")
        .select("*")
        .eq("game_id", dbGame.id)
        .is("correct", null);

      if (picksError) {
        console.error(`Error fetching picks for game ${dbGame.id}:`, picksError);
        continue;
      }

      for (const pick of picks || []) {
        let spreadCorrect: boolean | null = null;
        let ouCorrect: boolean | null = null;

        // Grade spread pick
        if (pick.pick === "home" || pick.pick === "away") {
          if (spreadPush) {
            spreadCorrect = null; // Push = no result
          } else if (pick.pick === "home") {
            spreadCorrect = homeCovered;
          } else {
            spreadCorrect = awayCovered;
          }
        }

        // Grade over/under pick
        if (pick.over_under_pick === "over" || pick.over_under_pick === "under") {
          if (totalPush) {
            ouCorrect = null;
          } else if (pick.over_under_pick === "over") {
            ouCorrect = wentOver;
          } else {
            ouCorrect = wentOver === false;
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
        }
      }
    }

    // Check if we should advance the week
    if (gamesResolved > 0) {
      const { data: appState } = await supabase
        .from("app_state")
        .select("current_week")
        .single();

      const currentWeek = appState?.current_week || 15;

      // Check if all games in current week are resolved
      const { data: remainingGames } = await supabase
        .from("games")
        .select("id")
        .eq("league", "NFL")
        .eq("week", currentWeek)
        .eq("season", 2025)
        .eq("game_status", "pending");

      if (!remainingGames || remainingGames.length === 0) {
        // All games resolved, advance week
        const nextWeek = currentWeek + 1;
        if (nextWeek <= 18) {
          await supabase
            .from("app_state")
            .update({ current_week: nextWeek, updated_at: new Date().toISOString() })
            .eq("id", 1);
          console.log(`Advanced to week ${nextWeek}`);
        }
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