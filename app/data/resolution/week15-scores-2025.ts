// app/data/schedule/nfl-week15-2025.ts
// NFL Week 15 2025 Schedule with Betting Spreads
// Source: ESPN/DraftKings (December 8, 2025)

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

export const NFL_WEEK_15_2025: NFLGame[] = [
  // Thursday Night Football - December 11, 2025
  {
    id: "nfl_2025_w15_atl_tb",
    week: 15,
    date: "2025-12-11",
    time: "8:15 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "TB",
    awayTeamShort: "ATL",
    spread: {
      home: "TB -4.5",
      away: "ATL +4.5",
      value: 4.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -218,
      away: 180
    },
    venue: "Raymond James Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Early Games - December 14, 2025
  {
    id: "nfl_2025_w15_cle_chi",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "CHI",
    awayTeamShort: "CLE",
    spread: {
      home: "CHI -7.5",
      away: "CLE +7.5",
      value: 7.5
    },
    overUnder: 40.5,
    moneyline: {
      home: -425,
      away: 330
    },
    venue: "Soldier Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_bal_cin",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "Cincinnati Bengals",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "CIN",
    awayTeamShort: "BAL",
    spread: {
      home: "CIN +2",
      away: "BAL -2",
      value: 2
    },
    overUnder: 52.5,
    moneyline: {
      home: 110,
      away: -130
    },
    venue: "Paycor Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_lac_kc",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "KC",
    awayTeamShort: "LAC",
    spread: {
      home: "KC -3.5",
      away: "LAC +3.5",
      value: 3.5
    },
    overUnder: 42.5,
    moneyline: {
      home: -198,
      away: 160
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_buf_ne",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Buffalo Bills",
    homeTeamShort: "NE",
    awayTeamShort: "BUF",
    spread: {
      home: "NE +1.5",
      away: "BUF -1.5",
      value: 1.5
    },
    overUnder: 50.5,
    moneyline: {
      home: -105,
      away: -115
    },
    venue: "Gillette Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_wsh_nyg",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "New York Giants",
    awayTeam: "Washington Commanders",
    homeTeamShort: "NYG",
    awayTeamShort: "WSH",
    spread: {
      home: "NYG -2.5",
      away: "WSH +2.5",
      value: 2.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -130,
      away: 110
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_lv_phi",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "PHI",
    awayTeamShort: "LV",
    spread: {
      home: "PHI -12.5",
      away: "LV +12.5",
      value: 12.5
    },
    overUnder: 38.5,
    moneyline: {
      home: -950,
      away: 625
    },
    venue: "Lincoln Financial Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_nyj_jax",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "New York Jets",
    homeTeamShort: "JAX",
    awayTeamShort: "NYJ",
    spread: {
      home: "JAX -12.5",
      away: "NYJ +12.5",
      value: 12.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -700,
      away: 500
    },
    venue: "EverBank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_ari_hou",
    week: 15,
    date: "2025-12-14",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "HOU",
    awayTeamShort: "ARI",
    spread: {
      home: "HOU -10",
      away: "ARI +10",
      value: 10
    },
    overUnder: 42.5,
    moneyline: {
      home: -535,
      away: 400
    },
    venue: "NRG Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday Afternoon Games - December 14, 2025
  {
    id: "nfl_2025_w15_gb_den",
    week: 15,
    date: "2025-12-14",
    time: "4:25 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "DEN",
    awayTeamShort: "GB",
    spread: {
      home: "DEN +2.5",
      away: "GB -2.5",
      value: 1.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 110,
      away: -130
    },
    venue: "Empower Field at Mile High",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_det_lar",
    week: 15,
    date: "2025-12-14",
    time: "4:25 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Detroit Lions",
    homeTeamShort: "LAR",
    awayTeamShort: "DET",
    spread: {
      home: "LAR -5.5",
      away: "DET +5.5",
      value: 5.5
    },
    overUnder: 55.5,
    moneyline: {
      home: -258,
      away: 210
    },
    venue: "SoFi Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_car_no",
    week: 15,
    date: "2025-12-14",
    time: "4:25 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "NO",
    awayTeamShort: "CAR",
    spread: {
      home: "NO +2.5",
      away: "CAR -2.5",
      value: 3
    },
    overUnder: 40.5,
    moneyline: {
      home: 124,
      away: -148
    },
    venue: "Caesars Superdome",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_ten_sf",
    week: 15,
    date: "2025-12-14",
    time: "4:25 PM",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "SF",
    awayTeamShort: "TEN",
    spread: {
      home: "SF -12.5",
      away: "TEN +12.5",
      value: 12.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -850,
      away: 575
    },
    venue: "Levi's Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w15_ind_sea",
    week: 15,
    date: "2025-12-14",
    time: "4:25 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "SEA",
    awayTeamShort: "IND",
    spread: {
      home: "SEA -13.5",
      away: "IND +13.5",
      value: 13.5
    },
    overUnder: 42.5,
    moneyline: {
      home: -850,
      away: 575
    },
    venue: "Lumen Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football - December 14, 2025
  {
    id: "nfl_2025_w15_min_dal",
    week: 15,
    date: "2025-12-14",
    time: "8:20 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "DAL",
    awayTeamShort: "MIN",
    spread: {
      home: "DAL -6",
      away: "MIN +6",
      value: 6
    },
    overUnder: 48.5,
    moneyline: {
      home: -285,
      away: 230
    },
    venue: "AT&T Stadium",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // Monday Night Football - December 15, 2025
  {
    id: "nfl_2025_w15_mia_pit",
    week: 15,
    date: "2025-12-15",
    time: "8:15 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "PIT",
    awayTeamShort: "MIA",
    spread: {
      home: "PIT -3",
      away: "MIA +3",
      value: 3
    },
    overUnder: 42.5,
    moneyline: {
      home: -180,
      away: 150
    },
    venue: "Acrisure Stadium",
    tv: ["ESPN"],
    isPrimetime: true
  }
];

// No byes in Week 15 - all 32 teams play
export const WEEK_15_BYES: string[] = [];