const SCHEDULE_CONFIG = {
  gameDays: [0, 3],
  gameStartHour: 20,
  gameDurationMinutes: 10,
  regularSeasonRounds: 14,
};

const SEASON_START_DATE = new Date("2026-04-29T21:30:05-03:00");

const teams = [
  { id: "1", name: "Blaine County Sheriff's" },
  { id: "2", name: "Mirror Park Mavericks" },
  { id: "3", name: "Vinewood Sharks" },
  { id: "4", name: "Del Perro Fishies" },
  { id: "5", name: "Chicanos La Mesa" },
  { id: "6", name: "Pacific Bulls" },
  { id: "7", name: "Maze Bank Titans" },
  { id: "8", name: "San Andreas State Warrior" },
  { id: "9", name: "Paleto Bay Three's" },
  { id: "10", name: "Youngers University Pride" },
  { id: "11", name: "Strawberry Fakers" },
  { id: "12", name: "Pillbox Pumpkins" },
  { id: "13", name: "Rockford Lions" },
  { id: "14", name: "Sandy Shores Drilling" },
  { id: "15", name: "Vespucci Vultures" },
  { id: "16", name: "Davis Hustlers" },
  { id: "17", name: "Little Seoul Serpents" },
  { id: "18", name: "Murrieta Howlers" },
  { id: "19", name: "Downtown Infernos" },
  { id: "20", name: "Fleeca Bank Patrick's" },
];

function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }

  return function () {
    h = (h + 0x9e3779b9) | 0;
    let t = Math.imul(h ^ (h >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return (t = (t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

function calculateDeterministicScore(gameId, teamType, seconds) {
  const rng = seededRandom(`${gameId}-${teamType}`);
  let score = 0;

  for (let i = 0; i <= seconds; i++) {
    const scoreChance = rng();
    if (scoreChance < 0.045) {
      const pointsChance = rng();
      if (pointsChance > 0.85) score += 3;
      else if (pointsChance < 0.15) score += 1;
      else score += 2;
    }
  }

  return score;
}

function calculateGameState(gameId, scheduledDate, now) {
  const totalDurationSeconds = SCHEDULE_CONFIG.gameDurationMinutes * 60;
  const secondsElapsed = Math.floor(
    (now.getTime() - scheduledDate.getTime()) / 1000,
  );

  if (secondsElapsed < 0) {
    return {
      homeScore: 0,
      awayScore: 0,
      isFinished: false,
    };
  }

  if (secondsElapsed >= totalDurationSeconds) {
    const finalHome = calculateDeterministicScore(
      gameId,
      "home",
      totalDurationSeconds,
    );
    const finalAway = calculateDeterministicScore(
      gameId,
      "away",
      totalDurationSeconds,
    );

    let adjustedHome = finalHome;
    let adjustedAway = finalAway;
    if (adjustedHome === adjustedAway) {
      const tieBreaker = seededRandom(`${gameId}-tie`)();
      if (tieBreaker > 0.5) adjustedHome += 1;
      else adjustedAway += 1;
    }

    return {
      homeScore: adjustedHome,
      awayScore: adjustedAway,
      isFinished: true,
    };
  }

  return {
    homeScore: calculateDeterministicScore(gameId, "home", secondsElapsed),
    awayScore: calculateDeterministicScore(gameId, "away", secondsElapsed),
    isFinished: false,
  };
}

function isGameDay(date) {
  return SCHEDULE_CONFIG.gameDays.includes(date.getDay());
}

function getNextGameDay(fromDate, seasonStartDate) {
  const start = seasonStartDate || SEASON_START_DATE;
  if (fromDate < start) {
    return new Date(start);
  }

  const next = new Date(fromDate);
  next.setHours(SCHEDULE_CONFIG.gameStartHour, 0, 0, 0);

  if (
    fromDate.getHours() >= SCHEDULE_CONFIG.gameStartHour + 1 ||
    (fromDate.getHours() === SCHEDULE_CONFIG.gameStartHour &&
      fromDate.getMinutes() >= SCHEDULE_CONFIG.gameDurationMinutes)
  ) {
    next.setDate(next.getDate() + 1);
  }

  while (!isGameDay(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function generateSeasonCalendar(startDate) {
  const calendar = [];
  let currentDate = startDate
    ? new Date(startDate)
    : getNextGameDay(new Date());

  for (let i = 0; i < SCHEDULE_CONFIG.regularSeasonRounds; i++) {
    calendar.push(new Date(currentDate));
    currentDate = getNextGameDay(
      new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
    );
  }

  return calendar;
}

function getCurrentRound(calendar, now) {
  for (let i = 0; i < calendar.length; i++) {
    const roundDate = calendar[i];
    const roundEnd = new Date(roundDate);
    roundEnd.setHours(
      SCHEDULE_CONFIG.gameStartHour,
      SCHEDULE_CONFIG.gameDurationMinutes,
      0,
      0,
    );

    if (now < roundEnd) {
      return i + 1;
    }
  }

  return calendar.length + 1;
}

function generateRoundMatchups(roundNumber) {
  const teamsCopy = [...teams];
  const numTeams = teamsCopy.length;

  const fixed = teamsCopy[0];
  const rotating = teamsCopy.slice(1);

  const rotateAmount = (roundNumber - 1) % (numTeams - 1);
  for (let i = 0; i < rotateAmount; i++) {
    rotating.unshift(rotating.pop());
  }

  const matchups = [];
  matchups.push([fixed, rotating[0]]);

  for (let i = 1; i < rotating.length; i += 2) {
    matchups.push([rotating[i], rotating[i + 1]]);
  }

  return matchups;
}

function buildRounds(calendar) {
  const rounds = [];
  for (let i = 1; i <= SCHEDULE_CONFIG.regularSeasonRounds; i++) {
    const matchups = generateRoundMatchups(i);
    rounds.push({
      number: i,
      date: calendar[i - 1],
      games: matchups.map(([home, away], index) => ({
        id: `r${i}-g${index + 1}`,
        homeTeam: home,
        awayTeam: away,
      })),
    });
  }
  return rounds;
}

function buildStandings(now, rounds) {
  const stats = new Map();
  for (const team of teams) {
    stats.set(team.id, {
      teamId: team.id,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  for (const round of rounds) {
    const roundEnd = new Date(
      round.date.getTime() + SCHEDULE_CONFIG.gameDurationMinutes * 60 * 1000,
    );
    if (now < roundEnd) continue;

    for (const game of round.games) {
      const gameState = calculateGameState(game.id, round.date, now);
      if (!gameState.isFinished) continue;

      const homeStats = stats.get(game.homeTeam.id);
      const awayStats = stats.get(game.awayTeam.id);

      homeStats.pointsFor += gameState.homeScore;
      homeStats.pointsAgainst += gameState.awayScore;
      awayStats.pointsFor += gameState.awayScore;
      awayStats.pointsAgainst += gameState.homeScore;

      if (gameState.homeScore > gameState.awayScore) {
        homeStats.wins += 1;
        awayStats.losses += 1;
      } else {
        awayStats.wins += 1;
        homeStats.losses += 1;
      }
    }
  }

  return stats;
}

function formatRoundLabel(roundNumber, roundDate) {
  const day = String(roundDate.getDate()).padStart(2, "0");
  const month = String(roundDate.getMonth() + 1).padStart(2, "0");
  const year = roundDate.getFullYear();
  return `Rodada ${roundNumber} - ${day}/${month}/${year}`;
}

function getUpcomingGames(now, rounds) {
  const currentRound = getCurrentRound(
    rounds.map((round) => round.date),
    now,
  );

  const targetRound = rounds.find((round) => round.number === currentRound);
  if (!targetRound) return [];

  const roundEnd = new Date(
    targetRound.date.getTime() +
      SCHEDULE_CONFIG.gameDurationMinutes * 60 * 1000,
  );
  if (now >= roundEnd) return [];

  const rodada = formatRoundLabel(targetRound.number, targetRound.date);
  return targetRound.games.map((game) => ({
    time1: game.homeTeam.name,
    time2: game.awayTeam.name,
    rodada,
  }));
}

function buildSeasonSnapshot(now = new Date()) {
  const calendar = generateSeasonCalendar(SEASON_START_DATE);
  const rounds = buildRounds(calendar);
  const standings = buildStandings(now, rounds);
  const upcomingGames = getUpcomingGames(now, rounds);

  return { standings, upcomingGames };
}

export { teams, buildSeasonSnapshot };
