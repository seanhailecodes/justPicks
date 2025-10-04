// app/data/nfl-week1-2025.ts
// 2025 NFL Week 1 Schedule with Current Betting Lines

export interface NFLGame {
  id: string;
  week: number;
  date: string;
  time: string; // ET
  homeTeam: string;
  awayTeam: string;
  homeTeamShort: string;
  awayTeamShort: string;
  spread: {
    home: string;
    away: string;
    value: number;
  };
  overUnder: number;
  moneyline: {
    home: number;
    away: number;
  };
  venue: string;
  tv: string[];
  isPrimetime: boolean;
  isNeutralSite?: boolean;
}

export const NFL_WEEK_1_2025: NFLGame[] = [
  {
    id: "2025-W1-DAL-PHI",
    week: 1,
    date: "2025-09-04",
    time: "8:20 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "PHI",
    awayTeamShort: "DAL",
    spread: {
      home: "PHI -7.5",
      away: "DAL +7.5",
      value: -7.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -410,
      away: 320
    },
    venue: "Lincoln Financial Field",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },
  {
    id: "2025-W1-KC-LAC",
    week: 1,
    date: "2025-09-05",
    time: "8:00 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "KC",
    awayTeamShort: "LAC",
    spread: {
      home: "KC -3",
      away: "LAC +3",
      value: -3
    },
    overUnder: 45.5,
    moneyline: {
      home: -170,
      away: 142
    },
    venue: "Arena Corinthians, São Paulo, Brazil",
    tv: ["YouTube", "YouTube TV"],
    isPrimetime: true,
    isNeutralSite: true
  },
  {
    id: "2025-W1-CAR-JAX",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "JAX",
    awayTeamShort: "CAR",
    spread: {
      home: "JAX -3",
      away: "CAR +3",
      value: -3
    },
    overUnder: 47.5,
    moneyline: {
      home: -162,
      away: 136
    },
    venue: "EverBank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W1-MIA-IND",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "Indianapolis Colts",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "IND",
    awayTeamShort: "MIA",
    spread: {
      home: "IND -1.5",
      away: "MIA +1.5",
      value: -1.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -120,
      away: 100
    },
    venue: "Lucas Oil Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-LV-NE",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "NE",
    awayTeamShort: "LV",
    spread: {
      home: "NE -3",
      away: "LV +3",
      value: -3
    },
    overUnder: 42.5,
    moneyline: {
      home: -148,
      away: 124
    },
    venue: "Gillette Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-PIT-NYJ",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "New York Jets",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "NYJ",
    awayTeamShort: "PIT",
    spread: {
      home: "NYJ +3",
      away: "PIT -3",
      value: 3
    },
    overUnder: 38.5,
    moneyline: {
      home: 130,
      away: -155
    },
    venue: "MetLife Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-CIN-CLE",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "CLE",
    awayTeamShort: "CIN",
    spread: {
      home: "CLE +5.5",
      away: "CIN -5.5",
      value: 5.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 200,
      away: -240
    },
    venue: "Huntington Bank Field",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-ARI-NO",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "NO",
    awayTeamShort: "ARI",
    spread: {
      home: "NO +6.5",
      away: "ARI -6.5",
      value: 6.5
    },
    overUnder: 42.5,
    moneyline: {
      home: 230,
      away: -285
    },
    venue: "Caesars Superdome",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W1-WAS-NYG",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "New York Giants",
    awayTeam: "Washington Commanders",
    homeTeamShort: "NYG",
    awayTeamShort: "WAS",
    spread: {
      home: "NYG +6",
      away: "WAS -6",
      value: 6
    },
    overUnder: 45.5,
    moneyline: {
      home: 215,
      away: -265
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W1-ATL-TB",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "TB",
    awayTeamShort: "ATL",
    spread: {
      home: "TB -2.5",
      away: "ATL +2.5",
      value: -2.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Raymond James Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W1-CHI-MIN",
    week: 1,
    date: "2025-09-07",
    time: "1:00 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "CHI",
    awayTeamShort: "MIN",
    spread: {
      home: "CHI +1.5",
      away: "MIN -1.5",
      value: 1.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "Soldier Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W1-SEA-SF",
    week: 1,
    date: "2025-09-07",
    time: "4:05 PM",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "SF",
    awayTeamShort: "SEA",
    spread: {
      home: "SF -2.5",
      away: "SEA +2.5",
      value: -2.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "Levi's Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-TEN-DEN",
    week: 1,
    date: "2025-09-07",
    time: "4:05 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "DEN",
    awayTeamShort: "TEN",
    spread: {
      home: "DEN -7.5",
      away: "TEN +7.5",
      value: -7.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -320,
      away: 260
    },
    venue: "Empower Field at Mile High",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-DET-GB",
    week: 1,
    date: "2025-09-07",
    time: "4:25 PM",
    homeTeam: "Green Bay Packers",
    awayTeam: "Detroit Lions",
    homeTeamShort: "GB",
    awayTeamShort: "DET",
    spread: {
      home: "GB +2.5",
      away: "DET -2.5",
      value: 2.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -105,
      away: -115
    },
    venue: "Lambeau Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W1-HOU-LAR",
    week: 1,
    date: "2025-09-07",
    time: "4:25 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Houston Texans",
    homeTeamShort: "LAR",
    awayTeamShort: "HOU",
    spread: {
      home: "LAR -2.5",
      away: "HOU +2.5",
      value: -2.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -145,
      away: 125
    },
    venue: "SoFi Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W1-BAL-BUF",
    week: 1,
    date: "2025-09-07",
    time: "8:20 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "BUF",
    awayTeamShort: "BAL",
    spread: {
      home: "BUF -1.5",
      away: "BAL +1.5",
      value: -1.5
    },
    overUnder: 52.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "Highmark Stadium",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  }
];