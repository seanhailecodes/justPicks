// app/data/nfl-week2-2025.ts
// 2025 NFL Week 2 Schedule (September 11-15)
// Note: Betting lines are estimates based on team strength

import { NFLGame } from './nfl-week1-2025';

export const NFL_WEEK_2_2025: NFLGame[] = [
  // THURSDAY, SEPTEMBER 11
  {
    id: "2025-W2-MIA-BUF",
    week: 2,
    date: "2025-09-11",
    time: "8:15 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "Miami Dolphins",
    homeTeamShort: "BUF",
    awayTeamShort: "MIA",
    spread: {
      home: "BUF -6.5",
      away: "MIA +6.5",
      value: -6.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -280,
      away: 230
    },
    venue: "Highmark Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // SUNDAY, SEPTEMBER 14 - 1:00 PM Games
  {
    id: "2025-W2-PHI-KC",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Philadelphia Eagles",
    homeTeamShort: "KC",
    awayTeamShort: "PHI",
    spread: {
      home: "KC +2.5",
      away: "PHI -2.5",
      value: 2.5
    },
    overUnder: 49.5,
    moneyline: {
      home: 115,
      away: -135
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W2-NYJ-TEN",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Tennessee Titans",
    awayTeam: "New York Jets",
    homeTeamShort: "TEN",
    awayTeamShort: "NYJ",
    spread: {
      home: "TEN +7",
      away: "NYJ -7",
      value: 7
    },
    overUnder: 40.5,
    moneyline: {
      home: 280,
      away: -350
    },
    venue: "Nissan Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W2-GB-ATL",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Atlanta Falcons",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "ATL",
    awayTeamShort: "GB",
    spread: {
      home: "ATL +3",
      away: "GB -3",
      value: 3
    },
    overUnder: 47.5,
    moneyline: {
      home: 140,
      away: -165
    },
    venue: "Mercedes-Benz Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W2-CLE-JAX",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Jacksonville Jaguars",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "JAX",
    awayTeamShort: "CLE",
    spread: {
      home: "JAX -4.5",
      away: "CLE +4.5",
      value: -4.5
    },
    overUnder: 43.5,
    moneyline: {
      home: -200,
      away: 170
    },
    venue: "EverBank Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W2-NO-DAL",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "DAL",
    awayTeamShort: "NO",
    spread: {
      home: "DAL -7",
      away: "NO +7",
      value: -7
    },
    overUnder: 45.5,
    moneyline: {
      home: -320,
      away: 260
    },
    venue: "AT&T Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W2-LAC-CAR",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Carolina Panthers",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "CAR",
    awayTeamShort: "LAC",
    spread: {
      home: "CAR +5.5",
      away: "LAC -5.5",
      value: 5.5
    },
    overUnder: 42.5,
    moneyline: {
      home: 210,
      away: -250
    },
    venue: "Bank of America Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W2-SF-MIN",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Minnesota Vikings",
    awayTeam: "San Francisco 49ers",
    homeTeamShort: "MIN",
    awayTeamShort: "SF",
    spread: {
      home: "MIN +4",
      away: "SF -4",
      value: 4
    },
    overUnder: 46.5,
    moneyline: {
      home: 175,
      away: -210
    },
    venue: "U.S. Bank Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W2-IND-HOU",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "HOU",
    awayTeamShort: "IND",
    spread: {
      home: "HOU -3",
      away: "IND +3",
      value: -3
    },
    overUnder: 47.5,
    moneyline: {
      home: -150,
      away: 130
    },
    venue: "NRG Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W2-SEA-NE",
    week: 2,
    date: "2025-09-14",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "NE",
    awayTeamShort: "SEA",
    spread: {
      home: "NE +2.5",
      away: "SEA -2.5",
      value: 2.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 120,
      away: -140
    },
    venue: "Gillette Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // SUNDAY, SEPTEMBER 14 - 4:05/4:25 PM Games
  {
    id: "2025-W2-ARI-LAR",
    week: 2,
    date: "2025-09-14",
    time: "4:05 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Arizona Cardinals",
    homeTeamShort: "LAR",
    awayTeamShort: "ARI",
    spread: {
      home: "LAR +3.5",
      away: "ARI -3.5",
      value: 3.5
    },
    overUnder: 48.5,
    moneyline: {
      home: 155,
      away: -180
    },
    venue: "SoFi Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W2-TB-DET",
    week: 2,
    date: "2025-09-14",
    time: "4:05 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Tampa Bay Buccaneers",
    homeTeamShort: "DET",
    awayTeamShort: "TB",
    spread: {
      home: "DET -6.5",
      away: "TB +6.5",
      value: -6.5
    },
    overUnder: 51.5,
    moneyline: {
      home: -285,
      away: 235
    },
    venue: "Ford Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W2-NYG-WAS",
    week: 2,
    date: "2025-09-14",
    time: "4:25 PM",
    homeTeam: "Washington Commanders",
    awayTeam: "New York Giants",
    homeTeamShort: "WAS",
    awayTeamShort: "NYG",
    spread: {
      home: "WAS -7.5",
      away: "NYG +7.5",
      value: -7.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -350,
      away: 280
    },
    venue: "Northwest Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W2-PIT-LV",
    week: 2,
    date: "2025-09-14",
    time: "4:25 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Pittsburgh Steelers",
    homeTeamShort: "LV",
    awayTeamShort: "PIT",
    spread: {
      home: "LV +5",
      away: "PIT -5",
      value: 5
    },
    overUnder: 39.5,
    moneyline: {
      home: 200,
      away: -240
    },
    venue: "Allegiant Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // SUNDAY NIGHT FOOTBALL
  {
    id: "2025-W2-CHI-DEN",
    week: 2,
    date: "2025-09-14",
    time: "8:20 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Chicago Bears",
    homeTeamShort: "DEN",
    awayTeamShort: "CHI",
    spread: {
      home: "DEN -3",
      away: "CHI +3",
      value: -3
    },
    overUnder: 42.5,
    moneyline: {
      home: -155,
      away: 135
    },
    venue: "Empower Field at Mile High",
    tv: ["NBC", "Peacock"],
    isPrimetime: true
  },

  // MONDAY NIGHT FOOTBALL
  {
    id: "2025-W2-CIN-BAL",
    week: 2,
    date: "2025-09-15",
    time: "8:15 PM",
    homeTeam: "Baltimore Ravens",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "BAL",
    awayTeamShort: "CIN",
    spread: {
      home: "BAL -3",
      away: "CIN +3",
      value: -3
    },
    overUnder: 50.5,
    moneyline: {
      home: -155,
      away: 135
    },
    venue: "M&T Bank Stadium",
    tv: ["ESPN", "ABC"],
    isPrimetime: true
  }
];