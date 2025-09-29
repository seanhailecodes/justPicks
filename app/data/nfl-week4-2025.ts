// app/data/nfl-week4-2025.ts
// 2025 NFL Week 4 Schedule with REAL ESPN betting lines
// Source: ESPN Betting - Week 4 2025

import { NFLGame } from './nfl-week1-2025';

export const NFL_WEEK_4_2025: NFLGame[] = [
  // THURSDAY NIGHT FOOTBALL
  {
    id: "2025-W4-SEA-ARI",
    week: 4,
    date: "2025-09-26",
    time: "8:15 PM",
    homeTeam: "Arizona Cardinals",
    awayTeam: "Seattle Seahawks",
    homeTeamShort: "ARI",
    awayTeamShort: "SEA",
    spread: {
      home: "ARI -1.5",
      away: "SEA +1.5",
      value: 1.5
    },
    overUnder: 43.5,
    moneyline: {
      home: -115,
      away: -105
    },
    venue: "State Farm Stadium",
    tv: ["Prime Video"],
    isPrimetime: true
  },

  // SUNDAY, SEPTEMBER 28 - 9:30 AM (London Game)
  {
    id: "2025-W4-MIN-PIT",
    week: 4,
    date: "2025-09-28",
    time: "9:30 AM",
    homeTeam: "Pittsburgh Steelers",
    awayTeam: "Minnesota Vikings",
    homeTeamShort: "PIT",
    awayTeamShort: "MIN",
    spread: {
      home: "PIT +2.5",
      away: "MIN -2.5",
      value: 2.5
    },
    overUnder: 40.5,
    moneyline: {
      home: 130,
      away: -150
    },
    venue: "Tottenham Hotspur Stadium, London",
    tv: ["NFL Network", "NFL+"],
    isPrimetime: false,
    isNeutralSite: true
  },

  // SUNDAY, SEPTEMBER 28 - 1:00 PM Games
  {
    id: "2025-W4-NO-BUF",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "Buffalo Bills",
    awayTeam: "New Orleans Saints",
    homeTeamShort: "BUF",
    awayTeamShort: "NO",
    spread: {
      home: "BUF -15.5",
      away: "NO +15.5",
      value: 15.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -1800,
      away: 900
    },
    venue: "Highmark Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W4-LAC-NYG",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "New York Giants",
    awayTeam: "Los Angeles Chargers",
    homeTeamShort: "NYG",
    awayTeamShort: "LAC",
    spread: {
      home: "NYG +6.5",
      away: "LAC -6.5",
      value: 6.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 230,
      away: -280
    },
    venue: "MetLife Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W4-WSH-ATL",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "Atlanta Falcons",
    awayTeam: "Washington Commanders",
    homeTeamShort: "ATL",
    awayTeamShort: "WSH",
    spread: {
      home: "ATL +2.5",
      away: "WSH -2.5",
      value: 2.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 125,
      away: -145
    },
    venue: "Mercedes-Benz Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W4-PHI-TB",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "Tampa Bay Buccaneers",
    awayTeam: "Philadelphia Eagles",
    homeTeamShort: "TB",
    awayTeamShort: "PHI",
    spread: {
      home: "TB +3.5",
      away: "PHI -3.5",
      value: 3.5
    },
    overUnder: 44.5,
    moneyline: {
      home: 145,
      away: -170
    },
    venue: "Raymond James Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W4-CLE-DET",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "Detroit Lions",
    awayTeam: "Cleveland Browns",
    homeTeamShort: "DET",
    awayTeamShort: "CLE",
    spread: {
      home: "DET -8.5",
      away: "CLE +8.5",
      value: 8.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -500,
      away: 360
    },
    venue: "Ford Field",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W4-CAR-NE",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "New England Patriots",
    awayTeam: "Carolina Panthers",
    homeTeamShort: "NE",
    awayTeamShort: "CAR",
    spread: {
      home: "NE -5.5",
      away: "CAR +5.5",
      value: 5.5
    },
    overUnder: 43.5,
    moneyline: {
      home: -230,
      away: 195
    },
    venue: "Gillette Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W4-TEN-HOU",
    week: 4,
    date: "2025-09-28",
    time: "1:00 PM",
    homeTeam: "Houston Texans",
    awayTeam: "Tennessee Titans",
    homeTeamShort: "HOU",
    awayTeamShort: "TEN",
    spread: {
      home: "HOU -6.5",
      away: "TEN +6.5",
      value: 6.5
    },
    overUnder: 39.5,
    moneyline: {
      home: -360,
      away: 280
    },
    venue: "NRG Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // SUNDAY, SEPTEMBER 28 - 4:05 PM Games
  {
    id: "2025-W4-JAX-SF",
    week: 4,
    date: "2025-09-28",
    time: "4:05 PM",
    homeTeam: "San Francisco 49ers",
    awayTeam: "Jacksonville Jaguars",
    homeTeamShort: "SF",
    awayTeamShort: "JAX",
    spread: {
      home: "SF -3.5",
      away: "JAX +3.5",
      value: 3.5
    },
    overUnder: 46.5,
    moneyline: {
      home: -175,
      away: 150
    },
    venue: "Levi's Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },
  {
    id: "2025-W4-IND-LAR",
    week: 4,
    date: "2025-09-28",
    time: "4:05 PM",
    homeTeam: "Los Angeles Rams",
    awayTeam: "Indianapolis Colts",
    homeTeamShort: "LAR",
    awayTeamShort: "IND",
    spread: {
      home: "LAR -3.5",
      away: "IND +3.5",
      value: 3.5
    },
    overUnder: 48.5,
    moneyline: {
      home: -190,
      away: 160
    },
    venue: "SoFi Stadium",
    tv: ["FOX"],
    isPrimetime: false
  },

  // SUNDAY, SEPTEMBER 28 - 4:25 PM Games
  {
    id: "2025-W4-CHI-LV",
    week: 4,
    date: "2025-09-28",
    time: "4:25 PM",
    homeTeam: "Las Vegas Raiders",
    awayTeam: "Chicago Bears",
    homeTeamShort: "LV",
    awayTeamShort: "CHI",
    spread: {
      home: "LV -1.5",
      away: "CHI +1.5",
      value: 1.5
    },
    overUnder: 47.5,
    moneyline: {
      home: -115,
      away: -105
    },
    venue: "Allegiant Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },
  {
    id: "2025-W4-BAL-KC",
    week: 4,
    date: "2025-09-28",
    time: "4:25 PM",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "Baltimore Ravens",
    homeTeamShort: "KC",
    awayTeamShort: "BAL",
    spread: {
      home: "KC +2.5",
      away: "BAL -2.5",
      value: 2.5
    },
    overUnder: 48.5,
    moneyline: {
      home: 130,
      away: -150
    },
    venue: "GEHA Field at Arrowhead Stadium",
    tv: ["CBS"],
    isPrimetime: false
  },

  // SUNDAY NIGHT FOOTBALL
  {
    id: "2025-W4-GB-DAL",
    week: 4,
    date: "2025-09-28",
    time: "8:20 PM",
    homeTeam: "Dallas Cowboys",
    awayTeam: "Green Bay Packers",
    homeTeamShort: "DAL",
    awayTeamShort: "GB",
    spread: {
      home: "DAL +6.5",
      away: "GB -6.5",
      value: 6.5
    },
    overUnder: 47.5,
    moneyline: {
      home: 225,
      away: -275
    },
    venue: "AT&T Stadium",
    tv: ["NBC"],
    isPrimetime: true
  },

  // MONDAY NIGHT FOOTBALL - Doubleheader (September 29)
  {
    id: "2025-W4-NYJ-MIA",
    week: 4,
    date: "2025-09-29",
    time: "7:15 PM",
    homeTeam: "Miami Dolphins",
    awayTeam: "New York Jets",
    homeTeamShort: "MIA",
    awayTeamShort: "NYJ",
    spread: {
      home: "MIA -2.5",
      away: "NYJ +2.5",
      value: 2.5
    },
    overUnder: 45.5,
    moneyline: {
      home: -140,
      away: 120
    },
    venue: "Hard Rock Stadium",
    tv: ["ESPN"],
    isPrimetime: true
  },
  {
    id: "2025-W4-CIN-DEN",
    week: 4,
    date: "2025-09-29",
    time: "8:15 PM",
    homeTeam: "Denver Broncos",
    awayTeam: "Cincinnati Bengals",
    homeTeamShort: "DEN",
    awayTeamShort: "CIN",
    spread: {
      home: "DEN -7.5",
      away: "CIN +7.5",
      value: 7.5
    },
    overUnder: 44.5,
    moneyline: {
      home: -380,
      away: 290
    },
    venue: "Empower Field at Mile High",
    tv: ["ABC"],
    isPrimetime: true
  }
];

// Teams on bye Week 4: None listed for this week