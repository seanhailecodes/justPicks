// NFL Week 9 2025 Schedule with Spreads
// Source: ESPN, CBS Sports, DraftKings, FanDuel (October 2025)

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

export const NFL_WEEK_9_2025: NFLGame[] = [
  // Thursday Night Football - October 30, 2025
  {
    id: "nfl_2025_w9_bal_mia",
    week: 9,
    date: "2025-10-30",
    time: "8:15 PM",
    homeTeam: "Miami Dolphins",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "MIA",
    awayTeamShort: "BAL",
    spread: {
      home: "MIA +7.5",
      away: "BAL -7.5",
      value: 7.5
    },
    overUnder: 50.5,
    moneyline: {
      home: 300,
      away: -400
    },
    venue: "Hard Rock Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Games - November 2, 2025 - 1:00 PM ET
  {
    id: "nfl_2025_w9_chi_cin",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "Cincinnati Bengals",
    awayTeam: "Chicago Bears",
    homeTeamShort: "CIN",
    awayTeamShort: "CHI",
    spread: {
      home: "CIN +2.5",
      away: "CHI -2.5",
      value: 2.5
    },
    overUnder: 51.5,
    moneyline: {
      home: 129,
      away: -155
    },
    venue: "Paycor Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_den_hou",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Denver Broncos",
    homeTeamShort: "HOU",
    awayTeamShort: "DEN",
    spread: {
      home: "HOU +1.5",
      away: "DEN -1.5",
      value: 1.5
    },
    overUnder: 39.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "NRG Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_lac_ten",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "TEN",
    awayTeamShort: "LAC",
    spread: {
      home: "TEN +9.5",
      away: "LAC -9.5",
      value: 9.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 380,
      away: -500
    },
    venue: "Nissan Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_ind_pit",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "PIT",
    awayTeamShort: "IND",
    spread: {
      home: "PIT +3",
      away: "IND -3",
      value: 3
    },
    overUnder: 42.5,
    moneyline: {
      home: 145,
      away: -170
    },
    venue: "Acrisure Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_sf_nyg",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "New York Giants",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "NYG",
    awayTeamShort: "SF",
    spread: {
      home: "NYG +2.5",
      away: "SF -2.5",
      value: 2.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 125,
      away: -150
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_min_det",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "DET",
    awayTeamShort: "MIN",
    spread: {
      home: "DET -8.5",
      away: "MIN +8.5",
      value: 8.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -400,
      away: 310
    },
    venue: "Ford Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_car_gb",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "Green Bay Packers",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "GB",
    awayTeamShort: "CAR",
    spread: {
      home: "GB -13.5",
      away: "CAR +13.5",
      value: 13.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -971,
      away: 631
    },
    venue: "Lambeau Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_atl_ne",
    week: 9,
    date: "2025-11-02",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "NE",
    awayTeamShort: "ATL",
    spread: {
      home: "NE -3",
      away: "ATL +3",
      value: 3
    },
    overUnder: 45.5,
    moneyline: {
      home: -165,
      away: 140
    },
    venue: "Gillette Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday Games - 4:05 PM / 4:25 PM ET
  {
    id: "nfl_2025_w9_jax_lv",
    week: 9,
    date: "2025-11-02",
    time: "4:05 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "LV",
    awayTeamShort: "JAX",
    spread: {
      home: "LV +3.5",
      away: "JAX -3.5",
      value: 3.5
    },
    overUnder: 40.5,
    moneyline: {
      home: 155,
      away: -185
    },
    venue: "Allegiant Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_no_lar",
    week: 9,
    date: "2025-11-02",
    time: "4:05 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "LAR",
    awayTeamShort: "NO",
    spread: {
      home: "LAR -13.5",
      away: "NO +13.5",
      value: 13.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -800,
      away: 550
    },
    venue: "SoFi Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w9_kc_buf",
    week: 9,
    date: "2025-11-02",
    time: "4:25 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Kansas City Chiefs",
    homeTeamShort: "BUF",
    awayTeamShort: "KC",
    spread: {
      home: "BUF +1.5",
      away: "KC -1.5",
      value: 1.5
    },
    overUnder: 51.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "Highmark Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football
  {
    id: "nfl_2025_w9_sea_was",
    week: 9,
    date: "2025-11-02",
    time: "8:20 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "WAS",
    awayTeamShort: "SEA",
    spread: {
      home: "WAS +3.5",
      away: "SEA -3.5",
      value: 3.5
    },
    overUnder: 48.5,
    moneyline: {
      home: 155,
      away: -185
    },
    venue: "Northwest Stadium",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // Monday Night Football - November 3, 2025
  {
    id: "nfl_2025_w9_ari_dal",
    week: 9,
    date: "2025-11-03",
    time: "8:15 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "DAL",
    awayTeamShort: "ARI",
    spread: {
      home: "DAL -3",
      away: "ARI +3",
      value: 3
    },
    overUnder: 51.5,
    moneyline: {
      home: -165,
      away: 140
    },
    venue: "AT&T Stadium",
    tv: ["ESPN"],
    isPrimetime: true
  }
];