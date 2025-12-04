// app/data/schedule/nfl-week14-2025.ts
// NFL Week 14 2025 Schedule with Betting Spreads
// Source: Multiple sportsbooks (December 2025)

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

export const NFL_WEEK_14_2025: NFLGame[] = [
  // Thursday Night Football - December 4, 2025
  {
    id: "nfl_2025_w14_dal_det",
    week: 14,
    date: "2025-12-04",
    time: "8:15 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "DET",
    awayTeamShort: "DAL",
    spread: {
      home: "DET -3",
      away: "DAL +3",
      value: 3
    },
    overUnder: 54.5,
    moneyline: {
      home: -165,
      away: 140
    },
    venue: "Ford Field",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Early Games - December 7, 2025
  {
    id: "nfl_2025_w14_sea_atl",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Atlanta Falcons",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "ATL",
    awayTeamShort: "SEA",
    spread: {
      home: "ATL +7.5",
      away: "SEA -7.5",
      value: 7.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 300,
      away: -400
    },
    venue: "Mercedes-Benz Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_ten_cle",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "CLE",
    awayTeamShort: "TEN",
    spread: {
      home: "CLE -4.5",
      away: "TEN +4.5",
      value: 4.5
    },
    overUnder: 33.5,
    moneyline: {
      home: -180,
      away: 155
    },
    venue: "Huntington Bank Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_chi_gb",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Green Bay Packers",
    awayTeam: "Chicago Bears",
    homeTeamShort: "GB",
    awayTeamShort: "CHI",
    spread: {
      home: "GB -6.5",
      away: "CHI +6.5",
      value: 6.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -180,
      away: 155
    },
    venue: "Lambeau Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_was_min",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Washington Commanders",
    homeTeamShort: "MIN",
    awayTeamShort: "WAS",
    spread: {
      home: "MIN -1.5",
      away: "WAS +1.5",
      value: 1.5
    },
    overUnder: 42.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "U.S. Bank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_mia_nyj",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "New York Jets",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "NYJ",
    awayTeamShort: "MIA",
    spread: {
      home: "NYJ +2.5",
      away: "MIA -2.5",
      value: 2.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "MetLife Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_no_tb",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "TB",
    awayTeamShort: "NO",
    spread: {
      home: "TB -8.5",
      away: "NO +8.5",
      value: 8.5
    },
    overUnder: 42.5,
    moneyline: {
      home: -320,
      away: 260
    },
    venue: "Raymond James Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_ind_jax",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "JAX",
    awayTeamShort: "IND",
    spread: {
      home: "JAX -1.5",
      away: "IND +1.5",
      value: 1.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "EverBank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_pit_bal",
    week: 14,
    date: "2025-12-07",
    time: "1:00 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "BAL",
    awayTeamShort: "PIT",
    spread: {
      home: "BAL -5.5",
      away: "PIT +5.5",
      value: 5
    },
    overUnder: 43.5,
    moneyline: {
      home: -250,
      away: 205
    },
    venue: "M&T Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Afternoon Games
  {
    id: "nfl_2025_w14_den_lv",
    week: 14,
    date: "2025-12-07",
    time: "4:05 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Denver Broncos",
    homeTeamShort: "LV",
    awayTeamShort: "DEN",
    spread: {
      home: "LV +7.5",
      away: "DEN -7.5",
      value: 7.5
    },
    overUnder: 40.5,
    moneyline: {
      home: 275,
      away: -350
    },
    venue: "Allegiant Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_cin_buf",
    week: 14,
    date: "2025-12-07",
    time: "4:25 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "BUF",
    awayTeamShort: "CIN",
    spread: {
      home: "BUF -6",
      away: "CIN +6",
      value: 6
    },
    overUnder: 51.5,
    moneyline: {
      home: -260,
      away: 210
    },
    venue: "Highmark Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w14_lar_ari",
    week: 14,
    date: "2025-12-07",
    time: "4:25 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "Los Angeles Rams",
    homeTeamShort: "ARI",
    awayTeamShort: "LAR",
    spread: {
      home: "ARI +7",
      away: "LAR -7",
      value: 7
    },
    overUnder: 48.5,
    moneyline: {
      home: 260,
      away: -320
    },
    venue: "State Farm Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday Night Football
  {
    id: "nfl_2025_w14_hou_kc",
    week: 14,
    date: "2025-12-07",
    time: "8:20 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Houston Texans",
    homeTeamShort: "KC",
    awayTeamShort: "HOU",
    spread: {
      home: "KC -4",
      away: "HOU +4",
      value: 4
    },
    overUnder: 41.5,
    moneyline: {
      home: -190,
      away: 160
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // Monday Night Football
  {
    id: "nfl_2025_w14_phi_lac",
    week: 14,
    date: "2025-12-08",
    time: "8:15 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Philadelphia Eagles",
    homeTeamShort: "LAC",
    awayTeamShort: "PHI",
    spread: {
      home: "LAC +2.5",
      away: "PHI -2.5",
      value: 2.5
    },
    overUnder: 40.5,
    moneyline: {
      home: 140,
      away: -165
    },
    venue: "SoFi Stadium",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];

// Teams on bye Week 14: Patriots, Giants, 49ers, Panthers
export const WEEK_14_BYES = ["NE", "NYG", "SF", "CAR"];