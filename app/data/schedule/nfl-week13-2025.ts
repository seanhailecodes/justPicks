// app/data/schedule/nfl-week13-2025.ts
// NFL Week 13 2025 Schedule with ACTUAL Spreads
// Source: ESPN, FOX Sports, DraftKings (November 2025)

export interface NFLGame {
  id: string;
  week: number;
  date: string;
  time: string;
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

export const NFL_WEEK_13_2025: NFLGame[] = [
  // THANKSGIVING GAMES - Thursday, November 27, 2025
  {
    id: "nfl_2025_w13_gb_det",
    week: 13,
    date: "2025-11-27",
    time: "1:00 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "DET",
    awayTeamShort: "GB",
    spread: {
      home: "DET -2.5",
      away: "GB +2.5",
      value: 2.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -140,
      away: 120
    },
    venue: "Ford Field",
    tv: ["FOX"],
    isPrimetime: true,
    notes: "Thanksgiving Game"
  },

  {
    id: "nfl_2025_w13_kc_dal",
    week: 13,
    date: "2025-11-27",
    time: "4:30 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Kansas City Chiefs",
    homeTeamShort: "DAL",
    awayTeamShort: "KC",
    spread: {
      home: "DAL +3",
      away: "KC -3",
      value: 3
    },
    overUnder: 52.5,
    moneyline: {
      home: 175,
      away: -210
    },
    venue: "AT&T Stadium",
    tv: ["CBS"],
    isPrimetime: true,
    notes: "Thanksgiving Game"
  },

  {
    id: "nfl_2025_w13_cin_bal",
    week: 13,
    date: "2025-11-27",
    time: "8:20 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "BAL",
    awayTeamShort: "CIN",
    spread: {
      home: "BAL -7",
      away: "CIN +7",
      value: 7
    },
    overUnder: 51.5,
    moneyline: {
      home: -350,
      away: 280
    },
    venue: "M&T Bank Stadium",
    tv: ["NBC"],
    isPrimetime: true,
    notes: "Thanksgiving Game"
  },

  // BLACK FRIDAY - November 28, 2025
  {
    id: "nfl_2025_w13_chi_phi",
    week: 13,
    date: "2025-11-28",
    time: "3:00 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "Chicago Bears",
    homeTeamShort: "PHI",
    awayTeamShort: "CHI",
    spread: {
      home: "PHI -7",
      away: "CHI +7",
      value: 7
    },
    overUnder: 48.5,
    moneyline: {
      home: -320,
      away: 260
    },
    venue: "Lincoln Financial Field",
    tv: ["Prime Video"],
    isPrimetime: true,
    notes: "Black Friday Game"
  },

  // Sunday Games - November 30, 2025 - Early
  {
    id: "nfl_2025_w13_sf_cle",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "CLE",
    awayTeamShort: "SF",
    spread: {
      home: "CLE +6",
      away: "SF -6",
      value: 6
    },
    overUnder: 40.5,
    moneyline: {
      home: 275,
      away: -350
    },
    venue: "Huntington Bank Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_ari_tb",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "TB",
    awayTeamShort: "ARI",
    spread: {
      home: "TB -3",
      away: "ARI +3",
      value: 3
    },
    overUnder: 44.5,
    moneyline: {
      home: -140,
      away: 120
    },
    venue: "Raymond James Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_hou_ind",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "Indianapolis Colts",
    awayTeam: "Houston Texans",
    homeTeamShort: "IND",
    awayTeamShort: "HOU",
    spread: {
      home: "IND -4.5",
      away: "HOU +4.5",
      value: 4.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -175,
      away: 150
    },
    venue: "Lucas Oil Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_no_mia",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "Miami Dolphins",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "MIA",
    awayTeamShort: "NO",
    spread: {
      home: "MIA -6",
      away: "NO +6",
      value: 6
    },
    overUnder: 41.5,
    moneyline: {
      home: -400,
      away: 320
    },
    venue: "Hard Rock Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_atl_nyj",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "New York Jets",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "NYJ",
    awayTeamShort: "ATL",
    spread: {
      home: "NYJ +2.5",
      away: "ATL -2.5",
      value: 2.5
    },
    overUnder: 39.5,
    moneyline: {
      home: 120,
      away: -140
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_jax_ten",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "TEN",
    awayTeamShort: "JAX",
    spread: {
      home: "TEN +6.5",
      away: "JAX -6.5",
      value: 6.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 240,
      away: -300
    },
    venue: "Nissan Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_lar_car",
    week: 13,
    date: "2025-11-30",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "Los Angeles Rams",
    homeTeamShort: "CAR",
    awayTeamShort: "LAR",
    spread: {
      home: "CAR +10.5",
      away: "LAR -10.5",
      value: 10.5
    },
    overUnder: 45.5,
    moneyline: {
      home: 500,
      away: -700
    },
    venue: "Bank of America Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday Afternoon Games
  {
    id: "nfl_2025_w13_min_sea",
    week: 13,
    date: "2025-11-30",
    time: "4:05 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "SEA",
    awayTeamShort: "MIN",
    spread: {
      home: "SEA -10.5",
      away: "MIN +10.5",
      value: 10.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -140,
      away: 120
    },
    venue: "Lumen Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_buf_pit",
    week: 13,
    date: "2025-11-30",
    time: "4:25 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Buffalo Bills",
    homeTeamShort: "PIT",
    awayTeamShort: "BUF",
    spread: {
      home: "PIT +4",
      away: "BUF -4",
      value: 4
    },
    overUnder: 47.5,
    moneyline: {
      home: 175,
      away: -210
    },
    venue: "Acrisure Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w13_lv_lac",
    week: 13,
    date: "2025-11-30",
    time: "4:25 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "LAC",
    awayTeamShort: "LV",
    spread: {
      home: "LAC -9.5",
      away: "LV +9.5",
      value: 9.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -500,
      away: 380
    },
    venue: "SoFi Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football
  {
    id: "nfl_2025_w13_den_was",
    week: 13,
    date: "2025-11-30",
    time: "8:20 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Denver Broncos",
    homeTeamShort: "WAS",
    awayTeamShort: "DEN",
    spread: {
      home: "WAS +6.5",
      away: "DEN -6.5",
      value: 6.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 240,
      away: -300
    },
    venue: "Northwest Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // Monday Night Football
  {
    id: "nfl_2025_w13_nyg_ne",
    week: 13,
    date: "2025-12-01",
    time: "8:15 PM",
    homeTeam: "New England Patriots",
    awayTeam: "New York Giants",
    homeTeamShort: "NE",
    awayTeamShort: "NYG",
    spread: {
      home: "NE -7.5",
      away: "NYG +7.5",
      value: 7.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -350,
      away: 280
    },
    venue: "Gillette Stadium",
    tv: ["ESPN"],
    isPrimetime: true
  }
];

// No teams on bye Week 13