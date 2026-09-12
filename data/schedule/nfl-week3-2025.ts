// app/data/nfl-week3-2025.ts
// 2025 NFL Week 3 Schedule (September 18-22)
// Updated with real games and current betting lines

import { NFLGame } from './nfl-week1-2025';

export const NFL_WEEK_3_2025: NFLGame[] = [
  // THURSDAY, SEPTEMBER 19
  {
    id: "2025-W3-MIA-BUF",
    week: 3,
    date: "2025-09-19",
    time: "8:15 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Miami Dolphins", 
    homeTeamShort: "BUF",
    awayTeamShort: "MIA",
    spread: {
      home: "BUF -13.5",
      away: "MIA +13.5",
      value: -13.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -900,
      away: 550
    },
    venue: "Highmark Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // SUNDAY, SEPTEMBER 21 - 1:00 PM Games
  {
    id: "2025-W3-NYJ-TB",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "New York Jets",
    homeTeamShort: "TB",
    awayTeamShort: "NYJ",
    spread: {
      home: "TB -6.5",
      away: "NYJ +6.5",
      value: -6.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -320,
      away: 260
    },
    venue: "Raymond James Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-IND-TEN",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "TEN",
    awayTeamShort: "IND",
    spread: {
      home: "TEN +3.5",
      away: "IND -3.5",
      value: 3.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 155,
      away: -185
    },
    venue: "Nissan Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-LV-WSH",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Las Vegas Raiders",
    homeTeamShort: "WSH",
    awayTeamShort: "LV",
    spread: {
      home: "WSH -5.5",
      away: "LV +5.5",
      value: -5.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -270,
      away: 220
    },
    venue: "Northwest Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-LAR-PHI",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Philadelphia Eagles",
    awayTeam: "Los Angeles Rams",
    homeTeamShort: "PHI",
    awayTeamShort: "LAR",
    spread: {
      home: "PHI -3.5",
      away: "LAR +3.5",
      value: -3.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -190,
      away: 160
    },
    venue: "Lincoln Financial Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-ATL-CAR",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "CAR",
    awayTeamShort: "ATL",
    spread: {
      home: "CAR +3.5",
      away: "ATL -3.5",
      value: 3.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 180,
      away: -215
    },
    venue: "Bank of America Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-HOU-JAX",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Houston Texans",
    homeTeamShort: "JAX",
    awayTeamShort: "HOU",
    spread: {
      home: "JAX -1.5",
      away: "HOU +1.5",
      value: -1.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -120,
      away: 100
    },
    venue: "TIAA Bank Field",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-GB-CLE",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "CLE",
    awayTeamShort: "GB",
    spread: {
      home: "CLE +8.5",
      away: "GB -8.5",
      value: 8.5
    },
    overUnder: 42.5,
    moneyline: {
      home: 340,
      away: -450
    },
    venue: "Huntington Bank Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-PIT-NE",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "NE",
    awayTeamShort: "PIT",
    spread: {
      home: "NE +1.5",
      away: "PIT -1.5",
      value: 1.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 100,
      away: -120
    },
    venue: "Gillette Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-CIN-MIN",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "MIN",
    awayTeamShort: "CIN",
    spread: {
      home: "MIN -3.5",
      away: "CIN +3.5",
      value: -3.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -175,
      away: 150
    },
    venue: "U.S. Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // SUNDAY, SEPTEMBER 21 - 4:05/4:25 PM Games
  {
    id: "2025-W3-DEN-LAC",
    week: 3,
    date: "2025-09-21",
    time: "4:05 PM",
    homeTeam: "Los Angeles Chargers",
    awayTeam: "Denver Broncos",
    homeTeamShort: "LAC",
    awayTeamShort: "DEN",
    spread: {
      home: "LAC -2.5",
      away: "DEN +2.5",
      value: -2.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -145,
      away: 125
    },
    venue: "SoFi Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-NO-SEA",
    week: 3,
    date: "2025-09-21",
    time: "4:05 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "SEA",
    awayTeamShort: "NO",
    spread: {
      home: "SEA -7.5",
      away: "NO +7.5",
      value: -7.5
    },
    overUnder: 41.5,
    moneyline: {
      home: -400,
      away: 300
    },
    venue: "Lumen Field",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-ARI-SF",
    week: 3,
    date: "2025-09-21",
    time: "4:25 PM",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "SF",
    awayTeamShort: "ARI",
    spread: {
      home: "SF -1.5",
      away: "ARI +1.5",
      value: -1.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -120,
      away: 100
    },
    venue: "Levi's Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-DAL-CHI",
    week: 3,
    date: "2025-09-21",
    time: "4:25 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "Dallas Cowboys",
    homeTeamShort: "CHI",
    awayTeamShort: "DAL",
    spread: {
      home: "CHI -1.5",
      away: "DAL +1.5",
      value: -1.5
    },
    overUnder: 49.5,
    moneyline: {
      home: -125,
      away: 105
    },
    venue: "Soldier Field",
    tv: ["FOX"],
    isPrimetime: false
  },

  // SUNDAY NIGHT FOOTBALL
  {
    id: "2025-W3-KC-NYG",
    week: 3,
    date: "2025-09-21",
    time: "8:20 PM",
    homeTeam: "New York Giants",
    awayTeam: "Kansas City Chiefs",
    homeTeamShort: "NYG",
    awayTeamShort: "KC",
    spread: {
      home: "NYG +6.5",
      away: "KC -6.5",
      value: 6.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 225,
      away: -275
    },
    venue: "MetLife Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // MONDAY NIGHT FOOTBALL
  {
    id: "2025-W3-DET-BAL",
    week: 3,
    date: "2025-09-22",
    time: "8:15 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Detroit Lions",
    homeTeamShort: "BAL",
    awayTeamShort: "DET",
    spread: {
      home: "BAL -5.5",
      away: "DET +5.5",
      value: -5.5
    },
    overUnder: 51.5,
    moneyline: {
      home: -250,
      away: 210
    },
    venue: "M&T Bank Stadium",
    tv: ["ABC", "ESPN"],
    isPrimetime: true
  }
];