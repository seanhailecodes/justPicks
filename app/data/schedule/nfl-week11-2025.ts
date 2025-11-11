// app/data/schedule/nfl-week11-2025.ts
// NFL Week 11 2025 Schedule with Spreads
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

export const NFL_WEEK_11_2025: NFLGame[] = [
  // Thursday Night Football - November 13, 2025
  {
    id: "nfl_2025_w11_nyj_ne",
    week: 11,
    date: "2025-11-13",
    time: "8:15 PM",
    homeTeam: "New England Patriots",
    awayTeam: "New York Jets",
    homeTeamShort: "NE",
    awayTeamShort: "NYJ",
    spread: {
      home: "NE -11.5",
      away: "NYJ +11.5",
      value: 11.5
    },
    overUnder: 38.5,
    moneyline: {
      home: -550,
      away: 410
    },
    venue: "Gillette Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday International - November 16, 2025
  {
    id: "nfl_2025_w11_was_mia",
    week: 11,
    date: "2025-11-16",
    time: "9:30 AM",
    homeTeam: "Miami Dolphins",
    awayTeam: "Washington Commanders",
    homeTeamShort: "MIA",
    awayTeamShort: "WAS",
    spread: {
      home: "MIA -2",
      away: "WAS +2",
      value: 2
    },
    overUnder: 46.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Santiago Bernabéu",
    tv: ["NFL Network"],
    isPrimetime: false,
    isNeutralSite: true
  },

  // Sunday 1:00 PM ET Games - November 16, 2025
  {
    id: "nfl_2025_w11_car_atl",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "Atlanta Falcons",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "ATL",
    awayTeamShort: "CAR",
    spread: {
      home: "ATL -3.5",
      away: "CAR +3.5",
      value: 3.5
    },
    overUnder: 43.5,
    moneyline: {
      home: -185,
      away: 155
    },
    venue: "Mercedes-Benz Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_tb_buf",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Tampa Bay Buccaneers",
    homeTeamShort: "BUF",
    awayTeamShort: "TB",
    spread: {
      home: "BUF -5.5",
      away: "TB +5.5",
      value: 5.5
    },
    overUnder: 50.5,
    moneyline: {
      home: -250,
      away: 205
    },
    venue: "Highmark Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_hou_ten",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "Houston Texans",
    homeTeamShort: "TEN",
    awayTeamShort: "HOU",
    spread: {
      home: "TEN +7.5",
      away: "HOU -7.5",
      value: 7.5
    },
    overUnder: 41.5,
    moneyline: {
      home: 280,
      away: -350
    },
    venue: "Nissan Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_chi_min",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Chicago Bears",
    homeTeamShort: "MIN",
    awayTeamShort: "CHI",
    spread: {
      home: "MIN -3",
      away: "CHI +3",
      value: 3
    },
    overUnder: 48.5,
    moneyline: {
      home: -165,
      away: 140
    },
    venue: "U.S. Bank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_gb_nyg",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "New York Giants",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "NYG",
    awayTeamShort: "GB",
    spread: {
      home: "NYG +4.5",
      away: "GB -4.5",
      value: 4.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 180,
      away: -220
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_cin_pit",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "PIT",
    awayTeamShort: "CIN",
    spread: {
      home: "PIT -5.5",
      away: "CIN +5.5",
      value: 5.5
    },
    overUnder: 50.5,
    moneyline: {
      home: -240,
      away: 200
    },
    venue: "Acrisure Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_lac_jax",
    week: 11,
    date: "2025-11-16",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "JAX",
    awayTeamShort: "LAC",
    spread: {
      home: "JAX +7.5",
      away: "LAC -7.5",
      value: 7.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 280,
      away: -350
    },
    venue: "EverBank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:05 PM ET Games - November 16, 2025
  {
    id: "nfl_2025_w11_sea_lar",
    week: 11,
    date: "2025-11-16",
    time: "4:05 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "LAR",
    awayTeamShort: "SEA",
    spread: {
      home: "LAR -2.5",
      away: "SEA +2.5",
      value: 2.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -145,
      away: 125
    },
    venue: "SoFi Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_sf_ari",
    week: 11,
    date: "2025-11-16",
    time: "4:05 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "ARI",
    awayTeamShort: "SF",
    spread: {
      home: "ARI -5.5",
      away: "SF +5.5",
      value: 5.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -240,
      away: 200
    },
    venue: "State Farm Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday 4:25 PM ET Games - November 16, 2025
  {
    id: "nfl_2025_w11_bal_cle",
    week: 11,
    date: "2025-11-16",
    time: "4:25 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "CLE",
    awayTeamShort: "BAL",
    spread: {
      home: "CLE +10.5",
      away: "BAL -10.5",
      value: 10.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 400,
      away: -550
    },
    venue: "Huntington Bank Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w11_kc_den",
    week: 11,
    date: "2025-11-16",
    time: "4:25 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Kansas City Chiefs",
    homeTeamShort: "DEN",
    awayTeamShort: "KC",
    spread: {
      home: "DEN +3.5",
      away: "KC -3.5",
      value: 3.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 155,
      away: -185
    },
    venue: "Empower Field at Mile High",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football - November 16, 2025
  {
    id: "nfl_2025_w11_det_phi",
    week: 11,
    date: "2025-11-16",
    time: "8:20 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "Detroit Lions",
    homeTeamShort: "PHI",
    awayTeamShort: "DET",
    spread: {
      home: "PHI +1.5",
      away: "DET -1.5",
      value: 1.5
    },
    overUnder: 51.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "Lincoln Financial Field",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // Monday Night Football - November 17, 2025
  {
    id: "nfl_2025_w11_dal_lv",
    week: 11,
    date: "2025-11-17",
    time: "8:15 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "LV",
    awayTeamShort: "DAL",
    spread: {
      home: "LV +3.5",
      away: "DAL -3.5",
      value: 3.5
    },
    overUnder: 50.5,
    moneyline: {
      home: 155,
      away: -185
    },
    venue: "Allegiant Stadium",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];