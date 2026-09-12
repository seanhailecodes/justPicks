// NFL Week 8 2025 Schedule with Spreads
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

export const NFL_WEEK_8_2025: NFLGame[] = [
  // Thursday Night Football - October 23, 2025
  {
    id: "nfl_2025_w8_min_lac",
    week: 8,
    date: "2025-10-23",
    time: "8:15 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "LAC",
    awayTeamShort: "MIN",
    spread: {
      home: "LAC -3",
      away: "MIN +3",
      value: 3
    },
    overUnder: 44.5,
    moneyline: {
      home: -155,
      away: 130
    },
    venue: "SoFi Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // Sunday Games - October 26, 2025
  {
    id: "nfl_2025_w8_mia_atl",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "Atlanta Falcons",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "ATL",
    awayTeamShort: "MIA",
    spread: {
      home: "ATL -7.5",
      away: "MIA +7.5",
      value: 7.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -410,
      away: 320
    },
    venue: "Mercedes-Benz Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_nyj_cin",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "Cincinnati Bengals",
    awayTeam: "New York Jets",
    homeTeamShort: "CIN",
    awayTeamShort: "NYJ",
    spread: {
      home: "CIN -6.5",
      away: "NYJ +6.5",
      value: 6.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -290,
      away: 235
    },
    venue: "Paycor Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_cle_ne",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "NE",
    awayTeamShort: "CLE",
    spread: {
      home: "NE -6.5",
      away: "CLE +6.5",
      value: 6.5
    },
    overUnder: 40.5,
    moneyline: {
      home: -325,
      away: 260
    },
    venue: "Gillette Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_nyg_phi",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "New York Giants",
    homeTeamShort: "PHI",
    awayTeamShort: "NYG",
    spread: {
      home: "PHI -7",
      away: "NYG +7",
      value: 7
    },
    overUnder: 44.5,
    moneyline: {
      home: -345,
      away: 275
    },
    venue: "Lincoln Financial Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_buf_car",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "Buffalo Bills",
    homeTeamShort: "CAR",
    awayTeamShort: "BUF",
    spread: {
      home: "CAR +7.5",
      away: "BUF -7.5",
      value: 7.5
    },
    overUnder: 46.5,
    moneyline: {
      home: 330,
      away: -425
    },
    venue: "Bank of America Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_chi_bal",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Chicago Bears",
    homeTeamShort: "BAL",
    awayTeamShort: "CHI",
    spread: {
      home: "BAL -6.5",
      away: "CHI +6.5",
      value: 6.5
    },
    overUnder: 50.5,
    moneyline: {
      home: -310,
      away: 250
    },
    venue: "M&T Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_sf_hou",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "HOU",
    awayTeamShort: "SF",
    spread: {
      home: "HOU -1.5",
      away: "SF +1.5",
      value: 1.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "NRG Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  {
    id: "nfl_2025_w8_tb_no",
    week: 8,
    date: "2025-10-26",
    time: "1:00 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "Tampa Bay Buccaneers",
    homeTeamShort: "NO",
    awayTeamShort: "TB",
    spread: {
      home: "NO +6.5",
      away: "TB -6.5",
      value: 6.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 235,
      away: -290
    },
    venue: "Caesars Superdome",
    tv: ["FOX"],
    isPrimetime: false
  },

  // Sunday 4:05 PM Game
  {
    id: "nfl_2025_w8_dal_den",
    week: 8,
    date: "2025-10-26",
    time: "4:05 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "DEN",
    awayTeamShort: "DAL",
    spread: {
      home: "DEN -3",
      away: "DAL +3",
      value: 3
    },
    overUnder: 49.5,
    moneyline: {
      home: -170,
      away: 142
    },
    venue: "Empower Field at Mile High",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday 4:25 PM Game
  {
    id: "nfl_2025_w8_ten_ind",
    week: 8,
    date: "2025-10-26",
    time: "4:25 PM",
    homeTeam: "Indianapolis Colts",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "IND",
    awayTeamShort: "TEN",
    spread: {
      home: "IND -14",
      away: "TEN +14",
      value: 14
    },
    overUnder: 47.5,
    moneyline: {
      home: -1050,
      away: 675
    },
    venue: "Lucas Oil Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // Sunday Night Football
  {
    id: "nfl_2025_w8_gb_pit",
    week: 8,
    date: "2025-10-26",
    time: "8:20 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "PIT",
    awayTeamShort: "GB",
    spread: {
      home: "PIT +3.5",
      away: "GB -3.5",
      value: 3.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 150,
      away: -180
    },
    venue: "Acrisure Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // Monday Night Football - October 27, 2025
  {
    id: "nfl_2025_w8_was_kc",
    week: 8,
    date: "2025-10-27",
    time: "8:15 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Washington Commanders",
    homeTeamShort: "KC",
    awayTeamShort: "WSH",
    spread: {
      home: "KC -10.5",
      away: "WSH +10.5",
      value: 10.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -650,
      away: 470
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];