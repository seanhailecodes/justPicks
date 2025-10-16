// NFL Week 7 2025 Schedule with Spreads
// Source: ESPN, CBS Sports, DraftKings, FOX Sports (October 2025)

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

export const NFL_WEEK_7_2025: NFLGame[] = [
  // Thursday Night Football - October 16, 2025
  {
    id: "nfl_2025_w7_pit_cin",
    week: 7,
    date: "2025-10-16",
    time: "8:15 PM",
    homeTeam: "Cincinnati Bengals",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "CIN",
    awayTeamShort: "PIT",
    spread: {
      home: "CIN +5.5",
      away: "PIT -5.5",
      value: 5.5
    },
    overUnder: 44,
    moneyline: {
      home: 215,
      away: -260
    },
    venue: "Paycor Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Games - October 19, 2025 (London)
  {
    id: "nfl_2025_w7_lar_jax",
    week: 7,
    date: "2025-10-19",
    time: "9:30 AM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Los Angeles Rams",
    homeTeamShort: "JAX",
    awayTeamShort: "LAR",
    spread: {
      home: "JAX +3",
      away: "LAR -3",
      value: 3
    },
    overUnder: 44.5,
    moneyline: {
      home: 130,
      away: -150
    },
    venue: "Wembley Stadium",
    tv: ["NFL Network"],
    isPrimetime: false,
    isNeutralSite: true
  },

  // Sunday 1:00 PM Games
  {
    id: "nfl_2025_w7_no_chi",
    week: 7,
    date: "2025-10-19",
    time: "1:00 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "CHI",
    awayTeamShort: "NO",
    spread: {
      home: "CHI -5.5",
      away: "NO +5.5",
      value: 5.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -240,
      away: 200
    },
    venue: "Soldier Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_car_nyj",
    week: 7,
    date: "2025-10-19",
    time: "1:00 PM",
    homeTeam: "New York Jets",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "NYJ",
    awayTeamShort: "CAR",
    spread: {
      home: "NYJ +1.5",
      away: "CAR -1.5",
      value: 1.5
    },
    overUnder: 42.5,
    moneyline: {
      home: 110,
      away: -130
    },
    venue: "MetLife Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_mia_cle",
    week: 7,
    date: "2025-10-19",
    time: "1:00 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "CLE",
    awayTeamShort: "MIA",
    spread: {
      home: "CLE -3",
      away: "MIA +3",
      value: 3
    },
    overUnder: 40.5,
    moneyline: {
      home: -142,
      away: 120
    },
    venue: "Cleveland Browns Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_phi_min",
    week: 7,
    date: "2025-10-19",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Philadelphia Eagles",
    homeTeamShort: "MIN",
    awayTeamShort: "PHI",
    spread: {
      home: "MIN +2.5",
      away: "PHI -2.5",
      value: 2.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 115,
      away: -135
    },
    venue: "U.S. Bank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_ne_ten",
    week: 7,
    date: "2025-10-19",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "New England Patriots",
    homeTeamShort: "TEN",
    awayTeamShort: "NE",
    spread: {
      home: "TEN +7",
      away: "NE -7",
      value: 7
    },
    overUnder: 42.5,
    moneyline: {
      home: 280,
      away: -355
    },
    venue: "Nissan Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_lv_kc",
    week: 7,
    date: "2025-10-19",
    time: "1:00 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "KC",
    awayTeamShort: "LV",
    spread: {
      home: "KC -11.5",
      away: "LV +11.5",
      value: 11.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -850,
      away: 575
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:05 PM Games
  {
    id: "nfl_2025_w7_nyg_den",
    week: 7,
    date: "2025-10-19",
    time: "4:05 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "New York Giants",
    homeTeamShort: "DEN",
    awayTeamShort: "NYG",
    spread: {
      home: "DEN -7",
      away: "NYG +7",
      value: 7
    },
    overUnder: 40.5,
    moneyline: {
      home: -375,
      away: 295
    },
    venue: "Empower Field at Mile High",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_ind_lac",
    week: 7,
    date: "2025-10-19",
    time: "4:05 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "LAC",
    awayTeamShort: "IND",
    spread: {
      home: "LAC -1.5",
      away: "IND +1.5",
      value: 1.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -122,
      away: 102
    },
    venue: "SoFi Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:25 PM Games
  {
    id: "nfl_2025_w7_was_dal",
    week: 7,
    date: "2025-10-19",
    time: "4:25 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Washington Commanders",
    homeTeamShort: "DAL",
    awayTeamShort: "WSH",
    spread: {
      home: "DAL +2.5",
      away: "WSH -2.5",
      value: 2.5
    },
    overUnder: 55.5,
    moneyline: {
      home: 124,
      away: -148
    },
    venue: "AT&T Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w7_gb_ari",
    week: 7,
    date: "2025-10-19",
    time: "4:25 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "ARI",
    awayTeamShort: "GB",
    spread: {
      home: "ARI +6.5",
      away: "GB -6.5",
      value: 6.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 250,
      away: -310
    },
    venue: "State Farm Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday Night Football
  {
    id: "nfl_2025_w7_atl_sf",
    week: 7,
    date: "2025-10-19",
    time: "8:20 PM",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "SF",
    awayTeamShort: "ATL",
    spread: {
      home: "SF -3",
      away: "ATL +3",
      value: 3
    },
    overUnder: 47.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Levi's Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // Monday Night Football - October 20, 2025
  {
    id: "nfl_2025_w7_tb_det",
    week: 7,
    date: "2025-10-20",
    time: "7:00 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Tampa Bay Buccaneers",
    homeTeamShort: "DET",
    awayTeamShort: "TB",
    spread: {
      home: "DET -5.5",
      away: "TB +5.5",
      value: 5.5
    },
    overUnder: 52.5,
    moneyline: {
      home: -250,
      away: 210
    },
    venue: "Ford Field",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  },

  {
    id: "nfl_2025_w7_hou_sea",
    week: 7,
    date: "2025-10-20",
    time: "10:00 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Houston Texans",
    homeTeamShort: "SEA",
    awayTeamShort: "HOU",
    spread: {
      home: "SEA -3.5",
      away: "HOU +3.5",
      value: 3.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -185,
      away: 155
    },
    venue: "Lumen Field",
    tv: ["ESPN"],
    isPrimetime: true
  }
];