// NFL Week 5 2025 Schedule with ACTUAL Spreads (Corrected)
// Source: ESPN, CBS Sports, DraftKings (October 2025)

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
  // Thursday Night Football - October 3, 2025 (COMPLETED)
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
      home: "LAR -8.5",
      away: "SF +8.5",
      value: 8.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -350,
      away: 280
    },
    venue: "SoFi Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Games - October 6, 2025
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
      home: "CLE +3.5",
      away: "MIN -3.5",
      value: 3.5
    },
    overUnder: 36.5,
    moneyline: {
      home: 165,
      away: -195
    },
    venue: "Tottenham Hotspur Stadium",
    tv: ["NFL Network"],
    isPrimetime: false,
    isNeutralSite: true
  },

  {
    id: "nfl_2025_w5_lv_ind",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Indianapolis Colts",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "IND",
    awayTeamShort: "LV",
    spread: {
      home: "IND -6.5",
      away: "LV +6.5",
      value: 6.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -300,
      away: 250
    },
    venue: "Lucas Oil Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_dal_nyj",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "New York Jets",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "NYJ",
    awayTeamShort: "DAL",
    spread: {
      home: "NYJ +2.5",
      away: "DAL -2.5",
      value: 2.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 120,
      away: -140
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_den_phi",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "Denver Broncos",
    homeTeamShort: "PHI",
    awayTeamShort: "DEN",
    spread: {
      home: "PHI -3.5",
      away: "DEN +3.5",
      value: 3.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -175,
      away: 145
    },
    venue: "Lincoln Financial Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_mia_car",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "CAR",
    awayTeamShort: "MIA",
    spread: {
      home: "CAR +1.5",
      away: "MIA -1.5",
      value: 1.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 115,
      away: -135
    },
    venue: "Bank of America Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_hou_bal",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Houston Texans",
    homeTeamShort: "BAL",
    awayTeamShort: "HOU",
    spread: {
      home: "BAL +1",
      away: "HOU -1",
      value: 1
    },
    overUnder: 47.5,
    moneyline: {
      home: 110,
      away: -130
    },
    venue: "M&T Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_nyg_no",
    week: 5,
    date: "2025-10-06",
    time: "1:00 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "New York Giants",
    homeTeamShort: "NO",
    awayTeamShort: "NYG",
    spread: {
      home: "NO -1.5",
      away: "NYG +1.5",
      value: 1.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -130,
      away: 110
    },
    venue: "Caesars Superdome",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_ten_ari",
    week: 5,
    date: "2025-10-06",
    time: "4:05 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "ARI",
    awayTeamShort: "TEN",
    spread: {
      home: "ARI -7.5",
      away: "TEN +7.5",
      value: 7.5
    },
    overUnder: 42.5,
    moneyline: {
      home: -425,
      away: 320
    },
    venue: "State Farm Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_tb_sea",
    week: 5,
    date: "2025-10-06",
    time: "4:05 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Tampa Bay Buccaneers",
    homeTeamShort: "SEA",
    awayTeamShort: "TB",
    spread: {
      home: "SEA -3.5",
      away: "TB +3.5",
      value: 3.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -195,
      away: 165
    },
    venue: "Lumen Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_was_lac",
    week: 5,
    date: "2025-10-06",
    time: "4:25 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Washington Commanders",
    homeTeamShort: "LAC",
    awayTeamShort: "WAS",
    spread: {
      home: "LAC -2.5",
      away: "WAS +2.5",
      value: 2.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -150,
      away: 130
    },
    venue: "SoFi Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_cin_det",
    week: 5,
    date: "2025-10-06",
    time: "4:25 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "DET",
    awayTeamShort: "CIN",
    spread: {
      home: "DET -10.5",
      away: "CIN +10.5",
      value: 10.5
    },
    overUnder: 52.5,
    moneyline: {
      home: -550,
      away: 400
    },
    venue: "Ford Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w5_ne_buf",
    week: 5,
    date: "2025-10-06",
    time: "8:20 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "New England Patriots",
    homeTeamShort: "BUF",
    awayTeamShort: "NE",
    spread: {
      home: "BUF -8.5",
      away: "NE +8.5",
      value: 8.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -450,
      away: 350
    },
    venue: "Highmark Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  {
    id: "nfl_2025_w5_kc_jax",
    week: 5,
    date: "2025-10-07",
    time: "8:15 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Kansas City Chiefs",
    homeTeamShort: "JAX",
    awayTeamShort: "KC",
    spread: {
      home: "JAX +3",
      away: "KC -3",
      value: 3
    },
    overUnder: 46,
    moneyline: {
      home: 135,
      away: -155
    },
    venue: "TIAA Bank Field",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];