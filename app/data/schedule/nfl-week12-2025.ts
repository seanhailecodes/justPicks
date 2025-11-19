// app/data/schedule/nfl-week12-2025.ts
// NFL Week 12 2025 Schedule with Spreads
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

export const NFL_WEEK_12_2025: NFLGame[] = [
  // Thursday Night Football - November 20, 2025
  {
    id: "nfl_2025_w12_buf_hou",
    week: 12,
    date: "2025-11-20",
    time: "8:15 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Buffalo Bills",
    homeTeamShort: "HOU",
    awayTeamShort: "BUF",
    spread: {
      home: "HOU +6",
      away: "BUF -6",
      value: 6
    },
    overUnder: 43.5,
    moneyline: {
      home: 210,
      away: -250
    },
    venue: "NRG Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday 1:00 PM ET Games - November 23, 2025
  {
    id: "nfl_2025_w12_pit_chi",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "CHI",
    awayTeamShort: "PIT",
    spread: {
      home: "CHI -3",
      away: "PIT +3",
      value: 3
    },
    overUnder: 45.5,
    moneyline: {
      home: -150,
      away: 130
    },
    venue: "Soldier Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_ne_cin",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Cincinnati Bengals",
    awayTeam: "New England Patriots",
    homeTeamShort: "CIN",
    awayTeamShort: "NE",
    spread: {
      home: "CIN +8",
      away: "NE -8",
      value: 8
    },
    overUnder: 49.5,
    moneyline: {
      home: 290,
      away: -380
    },
    venue: "Paycor Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_nyg_det",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "New York Giants",
    homeTeamShort: "DET",
    awayTeamShort: "NYG",
    spread: {
      home: "DET -10.5",
      away: "NYG +10.5",
      value: 10.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -650,
      away: 425
    },
    venue: "Ford Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_min_gb",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Green Bay Packers",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "GB",
    awayTeamShort: "MIN",
    spread: {
      home: "GB -6.5",
      away: "MIN +6.5",
      value: 6.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -290,
      away: 240
    },
    venue: "Lambeau Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_sea_ten",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "TEN",
    awayTeamShort: "SEA",
    spread: {
      home: "TEN +13.5",
      away: "SEA -13.5",
      value: 13.5
    },
    overUnder: 40.5,
    moneyline: {
      home: 550,
      away: -900
    },
    venue: "Nissan Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_ind_kc",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "KC",
    awayTeamShort: "IND",
    spread: {
      home: "KC -3.5",
      away: "IND +3.5",
      value: 3.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -165,
      away: 140
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_nyj_bal",
    week: 12,
    date: "2025-11-23",
    time: "1:00 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "New York Jets",
    homeTeamShort: "BAL",
    awayTeamShort: "NYJ",
    spread: {
      home: "BAL -13.5",
      away: "NYJ +13.5",
      value: 13.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -1400,
      away: 750
    },
    venue: "M&T Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:05 PM ET Games - November 23, 2025
  {
    id: "nfl_2025_w12_cle_lv",
    week: 12,
    date: "2025-11-23",
    time: "4:05 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "LV",
    awayTeamShort: "CLE",
    spread: {
      home: "LV -3.5",
      away: "CLE +3.5",
      value: 3.5
    },
    overUnder: 36.5,
    moneyline: {
      home: -180,
      away: 150
    },
    venue: "Allegiant Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_jax_ari",
    week: 12,
    date: "2025-11-23",
    time: "4:05 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "ARI",
    awayTeamShort: "JAX",
    spread: {
      home: "ARI +2.5",
      away: "JAX -2.5",
      value: 2.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -145,
      away: 125
    },
    venue: "State Farm Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:25 PM ET Games - November 23, 2025
  {
    id: "nfl_2025_w12_phi_dal",
    week: 12,
    date: "2025-11-23",
    time: "4:25 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Philadelphia Eagles",
    homeTeamShort: "DAL",
    awayTeamShort: "PHI",
    spread: {
      home: "DAL -3.5",
      away: "PHI +3.5",
      value: 3.5
    },
    overUnder: 48.5,
    moneyline: {
      home: 148,
      away: -176
    },
    venue: "AT&T Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w12_atl_no",
    week: 12,
    date: "2025-11-23",
    time: "4:25 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "NO",
    awayTeamShort: "ATL",
    spread: {
      home: "NO -1.5",
      away: "ATL +1.5",
      value: 1.5
    },
    overUnder: 39.5,
    moneyline: {
      home: 110,
      away: -120
    },
    venue: "Caesars Superdome",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday Night Football - November 23, 2025
  {
    id: "nfl_2025_w12_tb_lar",
    week: 12,
    date: "2025-11-23",
    time: "8:20 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Tampa Bay Buccaneers",
    homeTeamShort: "LAR",
    awayTeamShort: "TB",
    spread: {
      home: "LAR -7",
      away: "TB +7",
      value: 7
    },
    overUnder: 49.5,
    moneyline: {
      home: -300,
      away: 250
    },
    venue: "SoFi Stadium",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // Monday Night Football - November 24, 2025
  {
    id: "nfl_2025_w12_car_sf",
    week: 12,
    date: "2025-11-24",
    time: "8:15 PM",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "SF",
    awayTeamShort: "CAR",
    spread: {
      home: "SF -6.5",
      away: "CAR +6.5",
      value: 6.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -320,
      away: 260
    },
    venue: "Levi's Stadium",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];
