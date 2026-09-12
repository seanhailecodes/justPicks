// NFL Week 6 2025 Schedule with Spreads
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

export const NFL_WEEK_6_2025: NFLGame[] = [
  // Thursday Night Football - October 10, 2025 (COMPLETED)
  // PHI @ NYG - NYG 34, PHI 17

  // Sunday Games - October 12, 2025
  {
    id: "nfl_2025_w6_den_nyj",
    week: 6,
    date: "2025-10-12",
    time: "9:30 AM",
    homeTeam: "New York Jets",
    awayTeam: "Denver Broncos",
    homeTeamShort: "NYJ",
    awayTeamShort: "DEN",
    spread: {
      home: "NYJ +6.5",
      away: "DEN -6.5",
      value: 6.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 250,
      away: -300
    },
    venue: "Tottenham Hotspur Stadium",
    tv: ["NFL Network"],
    isPrimetime: false,
    isNeutralSite: true
  },

  {
    id: "nfl_2025_w6_ari_ind",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "Indianapolis Colts",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "IND",
    awayTeamShort: "ARI",
    spread: {
      home: "IND -6.5",
      away: "ARI +6.5",
      value: 6.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -280,
      away: 230
    },
    venue: "Lucas Oil Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_lac_mia",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "Miami Dolphins",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "MIA",
    awayTeamShort: "LAC",
    spread: {
      home: "MIA +3.5",
      away: "LAC -3.5",
      value: 3.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 145,
      away: -170
    },
    venue: "Hard Rock Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_ne_no",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "New England Patriots",
    homeTeamShort: "NO",
    awayTeamShort: "NE",
    spread: {
      home: "NO +3.5",
      away: "NE -3.5",
      value: 3.5
    },
    overUnder: 45.5,
    moneyline: {
      home: 145,
      away: -170
    },
    venue: "Caesars Superdome",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_cle_pit",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "PIT",
    awayTeamShort: "CLE",
    spread: {
      home: "PIT -6.5",
      away: "CLE +6.5",
      value: 6.5
    },
    overUnder: 38.5,
    moneyline: {
      home: -280,
      away: 230
    },
    venue: "Acrisure Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_dal_car",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "CAR",
    awayTeamShort: "DAL",
    spread: {
      home: "CAR +3.5",
      away: "DAL -3.5",
      value: 3.5
    },
    overUnder: 49.5,
    moneyline: {
      home: 145,
      away: -170
    },
    venue: "Bank of America Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_sea_jax",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "JAX",
    awayTeamShort: "SEA",
    spread: {
      home: "JAX +1.5",
      away: "SEA -1.5",
      value: 1.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "EverBank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_lar_bal",
    week: 6,
    date: "2025-10-12",
    time: "1:00 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Los Angeles Rams",
    homeTeamShort: "BAL",
    awayTeamShort: "LAR",
    spread: {
      home: "BAL +7.5",
      away: "LAR -7.5",
      value: 7.5
    },
    overUnder: 45.5,
    moneyline: {
      home: 300,
      away: -380
    },
    venue: "M&T Bank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_ten_lv",
    week: 6,
    date: "2025-10-12",
    time: "4:05 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "LV",
    awayTeamShort: "TEN",
    spread: {
      home: "LV -3.5",
      away: "TEN +3.5",
      value: 3.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -170,
      away: 145
    },
    venue: "Allegiant Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_cin_gb",
    week: 6,
    date: "2025-10-12",
    time: "4:25 PM",
    homeTeam: "Green Bay Packers",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "GB",
    awayTeamShort: "CIN",
    spread: {
      home: "GB -14.5",
      away: "CIN +14.5",
      value: 14.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -800,
      away: 550
    },
    venue: "Lambeau Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w6_sf_tb",
    week: 6,
    date: "2025-10-12",
    time: "4:25 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "TB",
    awayTeamShort: "SF",
    spread: {
      home: "TB -3.5",
      away: "SF +3.5",
      value: 3.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -170,
      away: 145
    },
    venue: "Raymond James Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football
  {
    id: "nfl_2025_w6_det_kc",
    week: 6,
    date: "2025-10-12",
    time: "8:20 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Detroit Lions",
    homeTeamShort: "KC",
    awayTeamShort: "DET",
    spread: {
      home: "KC -2.5",
      away: "DET +2.5",
      value: 2.5
    },
    overUnder: 52.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // Monday Night Football - October 13, 2025
  {
    id: "nfl_2025_w6_buf_atl",
    week: 6,
    date: "2025-10-13",
    time: "7:15 PM",
    homeTeam: "Atlanta Falcons",
    awayTeam: "Buffalo Bills",
    homeTeamShort: "ATL",
    awayTeamShort: "BUF",
    spread: {
      home: "ATL +4.5",
      away: "BUF -4.5",
      value: 4.5
    },
    overUnder: 49.5,
    moneyline: {
      home: 180,
      away: -220
    },
    venue: "Mercedes-Benz Stadium",
    tv: ["ESPN"],
    isPrimetime: true
  },

  {
    id: "nfl_2025_w6_chi_was",
    week: 6,
    date: "2025-10-13",
    time: "8:15 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Chicago Bears",
    homeTeamShort: "WSH",
    awayTeamShort: "CHI",
    spread: {
      home: "WSH -4.5",
      away: "CHI +4.5",
      value: 4.5
    },
    overUnder: 50.5,
    moneyline: {
      home: -220,
      away: 180
    },
    venue: "Northwest Stadium",
    tv: ["ESPN"],
    isPrimetime: true
  }
];