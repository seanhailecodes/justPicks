// app/data/nfl-week3-2025.ts
// 2025 NFL Week 3 Schedule (September 18-22)
// Note: Betting lines are estimates based on team strength

import { NFLGame } from './nfl-week1-2025';

export const NFL_WEEK_3_2025: NFLGame[] = [
  // THURSDAY, SEPTEMBER 18
  {
    id: "2025-W3-NE-NYJ",
    week: 3,
    date: "2025-09-18",
    time: "8:15 PM",
    homeTeam: "New York Jets",
    awayTeam: "New England Patriots",
    homeTeamShort: "NYJ",
    awayTeamShort: "NE",
    spread: {
      home: "NYJ -4",
      away: "NE +4",
      value: -4
    },
    overUnder: 38.5,
    moneyline: {
      home: -190,
      away: 160
    },
    venue: "MetLife Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // SUNDAY, SEPTEMBER 21 - 1:00 PM Games
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
      home: "PHI -6.5",
      away: "LAR +6.5",
      value: -6.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -280,
      away: 230
    },
    venue: "Lincoln Financial Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-DEN-TB",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "Denver Broncos",
    homeTeamShort: "TB",
    awayTeamShort: "DEN",
    spread: {
      home: "TB +3.5",
      away: "DEN -3.5",
      value: 3.5
    },
    overUnder: 43.5,
    moneyline: {
      home: 155,
      away: -180
    },
    venue: "Raymond James Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-HOU-MIN",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Houston Texans",
    homeTeamShort: "MIN",
    awayTeamShort: "HOU",
    spread: {
      home: "MIN +1",
      away: "HOU -1",
      value: 1
    },
    overUnder: 46.5,
    moneyline: {
      home: -105,
      away: -115
    },
    venue: "U.S. Bank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-NYG-CLE",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Cleveland Browns",
    awayTeam: "New York Giants",
    homeTeamShort: "CLE",
    awayTeamShort: "NYG",
    spread: {
      home: "CLE -3",
      away: "NYG +3",
      value: -3
    },
    overUnder: 40.5,
    moneyline: {
      home: -155,
      away: 135
    },
    venue: "Huntington Bank Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-IND-CHI",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Chicago Bears",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "CHI",
    awayTeamShort: "IND",
    spread: {
      home: "CHI +2.5",
      away: "IND -2.5",
      value: 2.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 120,
      away: -140
    },
    venue: "Soldier Field",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-LAC-PIT",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "PIT",
    awayTeamShort: "LAC",
    spread: {
      home: "PIT +1.5",
      away: "LAC -1.5",
      value: 1.5
    },
    overUnder: 41.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "Acrisure Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-GB-TEN",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "TEN",
    awayTeamShort: "GB",
    spread: {
      home: "TEN +9.5",
      away: "GB -9.5",
      value: 9.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 380,
      away: -500
    },
    venue: "Nissan Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-CAR-LV",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "LV",
    awayTeamShort: "CAR",
    spread: {
      home: "LV -2.5",
      away: "CAR +2.5",
      value: -2.5
    },
    overUnder: 39.5,
    moneyline: {
      home: -135,
      away: 115
    },
    venue: "Allegiant Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-MIA-SEA",
    week: 3,
    date: "2025-09-21",
    time: "1:00 PM",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "SEA",
    awayTeamShort: "MIA",
    spread: {
      home: "SEA -1",
      away: "MIA +1",
      value: -1
    },
    overUnder: 45.5,
    moneyline: {
      home: -115,
      away: -105
    },
    venue: "Lumen Field",
    tv: ["CBS"],
    isPrimetime: false
  },

  // SUNDAY, SEPTEMBER 21 - 4:05/4:25 PM Games
  {
    id: "2025-W3-BAL-DAL",
    week: 3,
    date: "2025-09-21",
    time: "4:25 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "DAL",
    awayTeamShort: "BAL",
    spread: {
      home: "DAL +1.5",
      away: "BAL -1.5",
      value: 1.5
    },
    overUnder: 49.5,
    moneyline: {
      home: 105,
      away: -125
    },
    venue: "AT&T Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-DET-ARI",
    week: 3,
    date: "2025-09-21",
    time: "4:25 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "Detroit Lions",
    homeTeamShort: "ARI",
    awayTeamShort: "DET",
    spread: {
      home: "ARI +3",
      away: "DET -3",
      value: 3
    },
    overUnder: 50.5,
    moneyline: {
      home: 140,
      away: -165
    },
    venue: "State Farm Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W3-JAX-BUF",
    week: 3,
    date: "2025-09-21",
    time: "4:25 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "BUF",
    awayTeamShort: "JAX",
    spread: {
      home: "BUF -5.5",
      away: "JAX +5.5",
      value: -5.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -240,
      away: 200
    },
    venue: "Highmark Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W3-SF-KC",
    week: 3,
    date: "2025-09-21",
    time: "4:25 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "KC",
    awayTeamShort: "SF",
    spread: {
      home: "KC +1",
      away: "SF -1",
      value: 1
    },
    overUnder: 47.5,
    moneyline: {
      home: -105,
      away: -115
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // SUNDAY NIGHT FOOTBALL
  {
    id: "2025-W3-ATL-WAS",
    week: 3,
    date: "2025-09-21",
    time: "8:20 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "Atlanta Falcons",
    homeTeamShort: "WAS",
    awayTeamShort: "ATL",
    spread: {
      home: "WAS -3.5",
      away: "ATL +3.5",
      value: -3.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -170,
      away: 145
    },
    venue: "Northwest Stadium",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // MONDAY NIGHT FOOTBALL
  {
    id: "2025-W3-CIN-NO",
    week: 3,
    date: "2025-09-22",
    time: "8:15 PM",
    homeTeam: "New Orleans Saints",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "NO",
    awayTeamShort: "CIN",
    spread: {
      home: "NO +8.5",
      away: "CIN -8.5",
      value: 8.5
    },
    overUnder: 45.5,
    moneyline: {
      home: 340,
      away: -420
    },
    venue: "Caesars Superdome",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];