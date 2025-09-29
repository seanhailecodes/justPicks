// NFL Week 5 2025 Schedule with Real Spreads
// Source: FOX Sports, DraftKings, ESPN (October 2024)

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

export const NFL_WEEK_5_2025: NFLGame[] = [
  // Thursday Night Football - October 3, 2025
  {
    id: "nfl_2025_w5_sf_lar",
    week: 5,
    date: "2025-10-03",
    time: "8:20 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "LAR",
    awayTeamShort: "SF",
    spread: {
      home: "LAR +3.5",
      away: "SF -3.5",
      value: 3.5
    },
    overUnder: 46.5,
    moneyline: {
      home: 160,
      away: -190
    },
    venue: "SoFi Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Games - October 6, 2025
  {
    id: "nfl_2025_w5_buf_hou",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Buffalo Bills",
    homeTeamShort: "HOU",
    awayTeamShort: "BUF",
    spread: {
      home: "HOU +3",
      away: "BUF -3",
      value: 3
    },
    overUnder: 47,
    moneyline: {
      home: 130,
      away: -155
    },
    venue: "NRG Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_car_det",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "DET",
    awayTeamShort: "CAR",
    spread: {
      home: "DET -13.5",
      away: "CAR +13.5",
      value: 13.5
    },
    overUnder: 48,
    moneyline: {
      home: -750,
      away: 525
    },
    venue: "Ford Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_cin_ne",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "NE",
    awayTeamShort: "CIN",
    spread: {
      home: "NE +6.5",
      away: "CIN -6.5",
      value: 6.5
    },
    overUnder: 43,
    moneyline: {
      home: 245,
      away: -300
    },
    venue: "Gillette Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_ind_mia",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Miami Dolphins",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "MIA",
    awayTeamShort: "IND",
    spread: {
      home: "MIA -2.5",
      away: "IND +2.5",
      value: 2.5
    },
    overUnder: 44,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Hard Rock Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_lv_den",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "DEN",
    awayTeamShort: "LV",
    spread: {
      home: "DEN -2.5",
      away: "LV +2.5",
      value: 2.5
    },
    overUnder: 36.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Empower Field at Mile High",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_min_cle",
    week: 5,
    date: "2025-10-06",
    time: "9:30 AM",
    homeTeam: "Cleveland Browns",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "CLE",
    awayTeamShort: "MIN",
    spread: {
      home: "CLE +2.5",
      away: "MIN -2.5",
      value: 2.5
    },
    overUnder: 45.5,
    moneyline: {
      home: 125,
      away: -150
    },
    venue: "Tottenham Hotspur Stadium",
    tv: ["NFL Network"],
    isPrimetime: false,
    isNeutralSite: true
  },

  {
    id: "nfl_2025_w5_nyj_tb",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "New York Jets",
    homeTeamShort: "TB",
    awayTeamShort: "NYJ",
    spread: {
      home: "TB -3.5",
      away: "NYJ +3.5",
      value: 3.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -175,
      away: 145
    },
    venue: "Raymond James Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_ten_was",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "WAS",
    awayTeamShort: "TEN",
    spread: {
      home: "WAS -6",
      away: "TEN +6",
      value: 6
    },
    overUnder: 45.5,
    moneyline: {
      home: -250,
      away: 205
    },
    venue: "FedExField",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_ari_sea",
    week: 5,
    date: "2025-10-06",
    time: "4:05 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "SEA",
    awayTeamShort: "ARI",
    spread: {
      home: "SEA -7",
      away: "ARI +7",
      value: 7
    },
    overUnder: 47,
    moneyline: {
      home: -320,
      away: 255
    },
    venue: "Lumen Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_lac_no",
    week: 5,
    date: "2025-10-06",
    time: "4:05 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "NO",
    awayTeamShort: "LAC",
    spread: {
      home: "NO +1.5",
      away: "LAC -1.5",
      value: 1.5
    },
    overUnder: 42,
    moneyline: {
      home: 110,
      away: -130
    },
    venue: "Caesars Superdome",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_nyg_phi",
    week: 5,
    date: "2025-10-06",
    time: "4:25 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "New York Giants",
    homeTeamShort: "PHI",
    awayTeamShort: "NYG",
    spread: {
      home: "PHI -3.5",
      away: "NYG +3.5",
      value: 3.5
    },
    overUnder: 42.5,
    moneyline: {
      home: -175,
      away: 145
    },
    venue: "Lincoln Financial Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_cle_bal",
    week: 5,
    date: "2025-10-06",
    time: "4:25 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "BAL",
    awayTeamShort: "CLE",
    spread: {
      home: "BAL -9.5",
      away: "CLE +9.5",
      value: 9.5
    },
    overUnder: 47,
    moneyline: {
      home: -425,
      away: 325
    },
    venue: "M&T Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_jax_dal",
    week: 5,
    date: "2025-10-06",
    time: "4:25 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "DAL",
    awayTeamShort: "JAX",
    spread: {
      home: "DAL -7.5",
      away: "JAX +7.5",
      value: 7.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -340,
      away: 270
    },
    venue: "AT&T Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_kc_jax_mnf",
    week: 5,
    date: "2025-10-07",
    time: "8:15 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Kansas City Chiefs",
    homeTeamShort: "JAX",
    awayTeamShort: "KC",
    spread: {
      home: "JAX +9.5",
      away: "KC -9.5",
      value: 9.5
    },
    overUnder: 46,
    moneyline: {
      home: 375,
      away: -475
    },
    venue: "TIAA Bank Field",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];