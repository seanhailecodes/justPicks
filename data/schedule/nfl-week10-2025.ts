// app/data/schedule/nfl-week10-2025.ts
// NFL Week 10 2025 Schedule with Spreads
// Source: ESPN, DraftKings, FanDuel (November 2025)

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

export const NFL_WEEK_10_2025: NFLGame[] = [
  // Thursday Night Football - November 6, 2025
  {
    id: "nfl_2025_w10_lv_den",
    week: 10,
    date: "2025-11-06",
    time: "8:15 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "DEN",
    awayTeamShort: "LV",
    spread: {
      home: "DEN -9.5",
      away: "LV +9.5",
      value: 9.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -450,
      away: 340
    },
    venue: "Empower Field at Mile High",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday International - November 9, 2025
  {
    id: "nfl_2025_w10_atl_ind",
    week: 10,
    date: "2025-11-09",
    time: "9:30 AM",
    homeTeam: "Indianapolis Colts",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "IND",
    awayTeamShort: "ATL",
    spread: {
      home: "IND -5.5",
      away: "ATL +5.5",
      value: 5.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -250,
      away: 210
    },
    venue: "Olympiastadion Berlin",
    tv: ["NFL Network"],
    isPrimetime: false,
    isNeutralSite: true
  },

  // Sunday 1:00 PM ET Games - November 9, 2025
  {
    id: "nfl_2025_w10_nyg_chi",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "New York Giants",
    homeTeamShort: "CHI",
    awayTeamShort: "NYG",
    spread: {
      home: "CHI -3.5",
      away: "NYG +3.5",
      value: 3.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -185,
      away: 155
    },
    venue: "Soldier Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_mia_buf",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "BUF",
    awayTeamShort: "MIA",
    spread: {
      home: "BUF -8.5",
      away: "MIA +8.5",
      value: 8.5
    },
    overUnder: 50.5,
    moneyline: {
      home: -425,
      away: 320
    },
    venue: "Highmark Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_ne_tb",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "New England Patriots",
    homeTeamShort: "TB",
    awayTeamShort: "NE",
    spread: {
      home: "TB -2.5",
      away: "NE +2.5",
      value: 2.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Raymond James Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_no_car",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "CAR",
    awayTeamShort: "NO",
    spread: {
      home: "CAR -4.5",
      away: "NO +4.5",
      value: 4.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -205,
      away: 170
    },
    venue: "Bank of America Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_jax_hou",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "HOU",
    awayTeamShort: "JAX",
    spread: {
      home: "HOU -1.5",
      away: "JAX +1.5",
      value: 1.5
    },
    overUnder: 43.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "NRG Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_bal_min",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "MIN",
    awayTeamShort: "BAL",
    spread: {
      home: "MIN +3.5",
      away: "BAL -3.5",
      value: 3.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 145,
      away: -170
    },
    venue: "U.S. Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_cle_nyj",
    week: 10,
    date: "2025-11-09",
    time: "1:00 PM",
    homeTeam: "New York Jets",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "NYJ",
    awayTeamShort: "CLE",
    spread: {
      home: "NYJ -1.5",
      away: "CLE +1.5",
      value: 1.5
    },
    overUnder: 37.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "MetLife Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:05 PM ET Games - November 9, 2025
  {
    id: "nfl_2025_w10_ari_sea",
    week: 10,
    date: "2025-11-09",
    time: "4:05 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "SEA",
    awayTeamShort: "ARI",
    spread: {
      home: "SEA -6.5",
      away: "ARI +6.5",
      value: 6.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -300,
      away: 240
    },
    venue: "Lumen Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday 4:25 PM ET Games - November 9, 2025
  {
    id: "nfl_2025_w10_sf_lar",
    week: 10,
    date: "2025-11-09",
    time: "4:25 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "LAR",
    awayTeamShort: "SF",
    spread: {
      home: "LAR -3",
      away: "SF +3",
      value: 3
    },
    overUnder: 49.5,
    moneyline: {
      home: -155,
      away: 130
    },
    venue: "SoFi Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w10_det_was",
    week: 10,
    date: "2025-11-09",
    time: "4:25 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Detroit Lions",
    homeTeamShort: "WAS",
    awayTeamShort: "DET",
    spread: {
      home: "WAS +8.5",
      away: "DET -8.5",
      value: 8.5
    },
    overUnder: 50.5,
    moneyline: {
      home: 300,
      away: -380
    },
    venue: "Northwest Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football - November 9, 2025
  {
    id: "nfl_2025_w10_pit_lac",
    week: 10,
    date: "2025-11-09",
    time: "8:20 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "LAC",
    awayTeamShort: "PIT",
    spread: {
      home: "LAC -3",
      away: "PIT +3",
      value: 3
    },
    overUnder: 44.5,
    moneyline: {
      home: -150,
      away: 130
    },
    venue: "SoFi Stadium",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // Monday Night Football - November 10, 2025
  {
    id: "nfl_2025_w10_phi_gb",
    week: 10,
    date: "2025-11-10",
    time: "8:15 PM",
    homeTeam: "Green Bay Packers",
    awayTeam: "Philadelphia Eagles",
    homeTeamShort: "GB",
    awayTeamShort: "PHI",
    spread: {
      home: "GB -2.5",
      away: "PHI +2.5",
      value: 2.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Lambeau Field",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];