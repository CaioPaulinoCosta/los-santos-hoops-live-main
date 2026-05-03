import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team, teams } from '@/data/teams';
import { scheduleManager } from '@/lib/scheduleManager';
import { useStandingsStore } from './useStandingsStore';
import { newsGenerator } from '@/lib/newsGenerator';
import { seededRandom } from '@/lib/utils';
import { calculateGameState, GAME_DURATION_MINUTES } from '@/lib/gameSimulation';

/**
 * STORE VERSION — Increment on every structural change to persisted data.
 * The migration logic in storage.getItem handles upgrades non-destructively.
 */
const STORE_VERSION = 2;

export type SeasonPhase =
    | 'regular'
    | 'quarterfinals'
    | 'semifinals'
    | 'finals'
    | 'completed';

export interface Game {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    homeScore: number;
    awayScore: number;
    isComplete: boolean;
    isLive: boolean;
}

export interface Round {
    number: number;
    date: Date;
    games: Game[];
    isComplete: boolean;
}

export interface SeasonState {
    // Schema version for safe migrations
    version: number;

    // Configuration
    seasonStartDate: Date | null;
    calendar: Date[];
    currentRound: number;
    phase: SeasonPhase;

    // Rounds
    rounds: Round[];

    // Playoffs
    playoffTeams: Team[];
    champion: Team | null;
    runnerUp: Team | null;
}

interface SeasonStore extends SeasonState {
    // Actions
    initializeSeason: (startDate?: Date) => void;
    generateRoundGames: (roundNumber: number) => Game[];
    updateGameScore: (gameId: string, homeScore: number, awayScore: number) => void;
    completeGame: (gameId: string, homeScore: number, awayScore: number) => void;
    simulateGame: (gameId: string) => void;
    advanceRound: () => void;
    checkAndGenerateResults: () => void;
    catchUpPastRounds: () => void;
    startPlayoffs: () => void;
    resetSeason: () => void;
    nuclearReset: () => void;
}

const initialState: SeasonState = {
    version: STORE_VERSION,
    seasonStartDate: null,
    calendar: [],
    currentRound: 1,
    phase: 'regular',
    rounds: [],
    playoffTeams: [],
    champion: null,
    runnerUp: null
};

/**
 * Helper: build sorted standings array from useStandingsStore
 */
function getStandingsSnapshot() {
    const { teamStats } = useStandingsStore.getState();
    return Array.from(teamStats.entries())
        .map(([teamId, stats]) => ({ teamId, wins: stats.wins, losses: stats.losses }))
        .sort((a, b) => {
            const aWinPct = a.wins / (a.wins + a.losses || 1);
            const bWinPct = b.wins / (b.wins + b.losses || 1);
            if (bWinPct !== aWinPct) return bWinPct - aWinPct;
            return b.wins - a.wins;
        });
}

export const useSeasonStore = create<SeasonStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            initializeSeason: async (startDate?) => {
                const state = get();
                const desiredStart = startDate || new Date("2026-04-29T20:00:00");

                /**
                 * SAFE INIT: If we already have rounds, do NOT reinitialize.
                 * Only complement missing future rounds to preserve all historical data.
                 */
                if (state.rounds.length > 0) {
                    // Trigger standings migration if needed
                    const { processedGameIds } = useStandingsStore.getState();
                    if (processedGameIds.size === 0) {
                        useStandingsStore.getState().rebuildFromRounds(state.rounds);
                    }

                    // Generate any missing future rounds (for regular season only)
                    if (state.phase === 'regular') {
                        const existingRoundNumbers = new Set(state.rounds.map(r => r.number));
                        let hasNewRounds = false;
                        const newRounds = [...state.rounds];

                        for (let i = 1; i <= 14; i++) {
                            if (!existingRoundNumbers.has(i)) {
                                const games = get().generateRoundGames(i);
                                newRounds.push({
                                    number: i,
                                    date: state.calendar[i - 1] || new Date(),
                                    games,
                                    isComplete: false
                                });
                                hasNewRounds = true;
                            }
                        }

                        if (hasNewRounds) {
                            newRounds.sort((a, b) => a.number - b.number);
                            set({ rounds: newRounds, version: STORE_VERSION });
                        }
                    }

                    // Always catch up past rounds on init (handles returning visitors)
                    get().catchUpPastRounds();
                    return;
                }

                /**
                 * FIRST-TIME INIT: Brand new user, generate everything from scratch.
                 */
                try {
                    // Tenta buscar do backend primeiro (opcional)
                    const response = await fetch('http://localhost:3001/season').catch(() => null);
                    const data = response ? await response.json().catch(() => ({})) : {};

                    // Se o backend retornou uma data, usa ela (prioridade)
                    const apiStartDate = data.startDate ? new Date(data.startDate) : null;
                    const finalDate = apiStartDate || desiredStart;

                    const calendar = scheduleManager.generateSeasonCalendar(finalDate);

                    // Generate ALL 14 regular season rounds upfront for consistency
                    const allRounds: Round[] = [];
                    for (let i = 1; i <= 14; i++) {
                        const games = get().generateRoundGames(i);
                        allRounds.push({
                            number: i,
                            date: calendar[i - 1],
                            games,
                            isComplete: false
                        });
                    }

                    set({
                        version: STORE_VERSION,
                        seasonStartDate: finalDate,
                        calendar,
                        currentRound: 1,
                        phase: 'regular',
                        rounds: allRounds,
                        playoffTeams: [],
                        champion: null,
                        runnerUp: null
                    });

                    // Immediately catch up past rounds for new visitors
                    get().catchUpPastRounds();

                } catch (error) {
                    // Silently fail
                }
            },

            nuclearReset: () => {
                // 1. Limpeza do LocalStorage Bruta
                localStorage.removeItem('season-storage');
                localStorage.removeItem('news-storage');
                localStorage.removeItem('standings-storage');
                
                // 2. Reset do estado atual
                set(initialState);

                // 3. Force Reload para limpar memória do React
                window.location.reload();
            },

            generateRoundGames: (roundNumber) => {
                const state = get();

                // Regular season
                if (roundNumber <= 14) {
                    const matchups = scheduleManager.generateRoundMatchups(roundNumber);
                    return matchups.map(([home, away], index) => ({
                        id: `r${roundNumber}-g${index + 1}`,
                        homeTeam: home,
                        awayTeam: away,
                        homeScore: 0,
                        awayScore: 0,
                        isComplete: false,
                        isLive: false
                    }));
                }

                // Playoffs
                const { playoffTeams } = state;
                if (playoffTeams.length === 0) return [];

                if (roundNumber === 15) {
                    // Quarterfinals
                    const matchups = scheduleManager.generatePlayoffMatchups(playoffTeams, 'quarters');
                    return matchups.map(([home, away], index) => ({
                        id: `playoff-q${index + 1}`,
                        homeTeam: home,
                        awayTeam: away,
                        homeScore: 0,
                        awayScore: 0,
                        isComplete: false,
                        isLive: false
                    }));
                } else if (roundNumber === 16) {
                    // Semifinals - get winners from previous round
                    const prevRound = state.rounds.find(r => r.number === 15);
                    if (!prevRound) return [];

                    const winners = prevRound.games
                        .filter(g => g.isComplete)
                        .map(g => g.homeScore > g.awayScore ? g.homeTeam : g.awayTeam)
                        .slice(0, 4);

                    if (winners.length < 4) return [];

                    return [
                        {
                            id: 'playoff-s1',
                            homeTeam: winners[0], // Winner of 1v8
                            awayTeam: winners[3], // Winner of 4v5
                            homeScore: 0,
                            awayScore: 0,
                            isComplete: false,
                            isLive: false
                        },
                        {
                            id: 'playoff-s2',
                            homeTeam: winners[1], // Winner of 2v7
                            awayTeam: winners[2], // Winner of 3v6
                            homeScore: 0,
                            awayScore: 0,
                            isComplete: false,
                            isLive: false
                        }
                    ];
                } else if (roundNumber === 17) {
                    // Finals
                    const prevRound = state.rounds.find(r => r.number === 16);
                    if (!prevRound) return [];

                    const finalists = prevRound.games
                        .filter(g => g.isComplete)
                        .map(g => g.homeScore > g.awayScore ? g.homeTeam : g.awayTeam);

                    if (finalists.length < 2) return [];

                    return [{
                        id: 'playoff-final',
                        homeTeam: finalists[0],
                        awayTeam: finalists[1],
                        homeScore: 0,
                        awayScore: 0,
                        isComplete: false,
                        isLive: false
                    }];
                }

                return [];
            },

            updateGameScore: (gameId, homeScore, awayScore) => {
                set((state) => ({
                    rounds: state.rounds.map(round => ({
                        ...round,
                        games: round.games.map(game =>
                            game.id === gameId
                                ? { ...game, homeScore, awayScore, isLive: true }
                                : game
                        )
                    }))
                }));
            },

            completeGame: (gameId, homeScore, awayScore) => {
                const state = get();

                // Find the game to check if already complete
                const targetRound = state.rounds.find(r => 
                    r.games.some(g => g.id === gameId)
                );
                const targetGame = targetRound?.games.find(g => g.id === gameId);
                
                // IMMUTABILITY GUARD: never re-process a completed game
                if (targetGame?.isComplete) return;

                // Update game AND check round completion in a SINGLE atomic set()
                const updatedRounds = state.rounds.map(round => {
                    const updatedGames = round.games.map(game => {
                        if (game.id === gameId) {
                            // Save to standings if regular season (with dedup protection)
                            if (state.phase === 'regular') {
                                useStandingsStore.getState().updateGameResult(
                                    game.id,
                                    game.homeTeam.id,
                                    game.awayTeam.id,
                                    homeScore,
                                    awayScore
                                );
                            }
                            return { ...game, isComplete: true, isLive: false, homeScore, awayScore };
                        }
                        return game;
                    });

                    // Check if ALL games in this round are now complete
                    const allComplete = updatedGames.every(g => g.isComplete);

                    return { ...round, games: updatedGames, isComplete: allComplete || round.isComplete };
                });

                set({ rounds: updatedRounds });

                // Generate news if the round just completed
                const completedRound = updatedRounds.find(r => 
                    r.games.some(g => g.id === gameId)
                );
                if (completedRound?.isComplete && !targetRound?.isComplete) {
                    newsGenerator.generateNewsForRound(completedRound, getStandingsSnapshot());
                }
            },

            simulateGame: (gameId) => {
                // Generate deterministic scores based on gameId
                const random = seededRandom(gameId);
                
                // Base 85 + random * 30 (range 85-115)
                const homeScore = Math.floor(random() * 30) + 85;
                const awayScore = Math.floor(random() * 30) + 85;

                // Ensure no ties (deterministic loop)
                let finalHome = homeScore;
                let finalAway = awayScore;
                while (finalHome === finalAway) {
                    finalHome += Math.floor(random() * 3) + 1;
                }

                get().updateGameScore(gameId, finalHome, finalAway);
                get().completeGame(gameId, finalHome, finalAway);
            },

            advanceRound: () => {
                const state = get();
                const nextRound = state.currentRound + 1;

                // Generate news for the completed round before advancing
                const completedRound = state.rounds.find(r => r.number === state.currentRound);
                if (completedRound && completedRound.isComplete) {
                    newsGenerator.generateNewsForRound(completedRound, getStandingsSnapshot());
                }

                // Check if we should start playoffs
                if (nextRound === 15 && state.phase === 'regular') {
                    get().startPlayoffs();
                    return;
                }

                // Check if season is complete
                if (nextRound > 17) {
                    const finalRound = state.rounds.find(r => r.number === 17);
                    if (finalRound && finalRound.games[0]) {
                        const finalGame = finalRound.games[0];
                        const winner = finalGame.homeScore > finalGame.awayScore
                            ? finalGame.homeTeam
                            : finalGame.awayTeam;
                        const loser = finalGame.homeScore > finalGame.awayScore
                            ? finalGame.awayTeam
                            : finalGame.homeTeam;

                        // Generate championship news
                        newsGenerator.generatePlayoffNews(
                            17,
                            winner,
                            loser,
                            `${Math.max(finalGame.homeScore, finalGame.awayScore)} a ${Math.min(finalGame.homeScore, finalGame.awayScore)}`
                        );

                        set({
                            phase: 'completed',
                            champion: winner,
                            runnerUp: loser
                        });
                    }
                    return;
                }

                // For regular season, the round should already exist (pre-generated)
                const existingRound = state.rounds.find(r => r.number === nextRound);
                if (existingRound) {
                    // Determine phase
                    let phase: SeasonPhase = 'regular';
                    if (nextRound === 15) phase = 'quarterfinals';
                    else if (nextRound === 16) phase = 'semifinals';
                    else if (nextRound === 17) phase = 'finals';

                    set({ currentRound: nextRound, phase });
                } else {
                    // Playoff rounds or missing rounds: generate on demand
                    const nextRoundGames = get().generateRoundGames(nextRound);
                    const nextRoundDate = state.calendar[nextRound - 1];

                    let phase: SeasonPhase = 'regular';
                    if (nextRound === 15) phase = 'quarterfinals';
                    else if (nextRound === 16) phase = 'semifinals';
                    else if (nextRound === 17) phase = 'finals';

                    set({
                        currentRound: nextRound,
                        phase,
                        rounds: [
                            ...state.rounds,
                            {
                                number: nextRound,
                                date: nextRoundDate,
                                games: nextRoundGames,
                                isComplete: false
                            }
                        ]
                    });
                }
            },

            /**
             * CRITICAL: Main game loop. Called every 5 seconds.
             * 
             * Rules:
             * 1. Completed games are IMMUTABLE — never recalculate
             * 2. Uses game.id as deterministic seed (not team ID concat)
             * 3. All state changes in a SINGLE atomic set() to prevent race conditions
             * 4. Standings updates use gameId-based deduplication
             */
            checkAndGenerateResults: () => {
                const state = get();
                const now = new Date();
                const currentRoundData = state.rounds.find(r => r.number === state.currentRound);

                if (!currentRoundData || currentRoundData.isComplete) return;

                let anyStatusChange = false;
                const updatedGames = currentRoundData.games.map(game => {
                    // IMMUTABLE: completed games are NEVER touched
                    if (game.isComplete) return game;

                    // Use game.id as seed for deterministic simulation
                    const gameState = calculateGameState(
                        game.id,
                        new Date(currentRoundData.date),
                        now
                    );

                    if (gameState.isFinished) {
                        anyStatusChange = true;

                        // Record in standings with dedup protection
                        if (state.phase === 'regular') {
                            useStandingsStore.getState().updateGameResult(
                                game.id,
                                game.homeTeam.id,
                                game.awayTeam.id,
                                gameState.homeScore,
                                gameState.awayScore
                            );
                        }

                        return {
                            ...game,
                            isComplete: true,
                            isLive: false,
                            homeScore: gameState.homeScore,
                            awayScore: gameState.awayScore
                        };
                    } else if (gameState.isLive) {
                        if (!game.isLive) anyStatusChange = true;
                        return {
                            ...game,
                            isLive: true,
                            homeScore: gameState.homeScore,
                            awayScore: gameState.awayScore
                        };
                    }
                    return game;
                });

                // Check if all games are now complete
                const allComplete = updatedGames.every(g => g.isComplete);
                const roundJustCompleted = allComplete && !currentRoundData.isComplete;

                // SINGLE ATOMIC SET — prevents race conditions from multiple set() calls
                if (anyStatusChange || roundJustCompleted || now.getSeconds() === 0) {
                    set({
                        rounds: state.rounds.map(r =>
                            r.number === state.currentRound
                                ? { ...r, games: updatedGames, isComplete: allComplete }
                                : r
                        )
                    });
                }

                // Generate news after the atomic set
                if (roundJustCompleted) {
                    newsGenerator.generateNewsForRound(
                        { ...currentRoundData, games: updatedGames, isComplete: true },
                        getStandingsSnapshot()
                    );
                }
            },

            /**
             * CATCH-UP: Process all past rounds that should already be complete.
             * Called during initialization to ensure new visitors see correct data.
             * Uses deterministic simulation — results are identical across all browsers.
             */
            catchUpPastRounds: () => {
                const state = get();
                const now = new Date();

                if (state.rounds.length === 0) return;

                let anyUpdated = false;
                let newCurrentRound = state.currentRound;
                const updatedRounds = state.rounds.map(round => {
                    // Skip already complete rounds
                    if (round.isComplete) {
                        return round;
                    }

                    // Only auto-process regular season (1-14)
                    if (round.number > 14) return round;

                    // Check if this round's game time has fully elapsed
                    const roundEndTime = new Date(
                        new Date(round.date).getTime() + GAME_DURATION_MINUTES * 60 * 1000
                    );
                    if (now < roundEndTime) return round; // Round hasn't finished yet

                    // Process all games in this round deterministically
                    const updatedGames = round.games.map(game => {
                        if (game.isComplete) return game;

                        const gameState = calculateGameState(
                            game.id,
                            new Date(round.date),
                            now
                        );

                        if (gameState.isFinished) {
                            // Record in standings (dedup-protected by gameId)
                            useStandingsStore.getState().updateGameResult(
                                game.id,
                                game.homeTeam.id,
                                game.awayTeam.id,
                                gameState.homeScore,
                                gameState.awayScore
                            );

                            return {
                                ...game,
                                isComplete: true,
                                isLive: false,
                                homeScore: gameState.homeScore,
                                awayScore: gameState.awayScore
                            };
                        }
                        return game;
                    });

                    const allComplete = updatedGames.every(g => g.isComplete);

                    if (allComplete) {
                        anyUpdated = true;

                        // Advance currentRound past this completed round
                        if (round.number >= newCurrentRound) {
                            newCurrentRound = round.number + 1;
                        }

                        // Generate news for this round
                        newsGenerator.generateNewsForRound(
                            { ...round, games: updatedGames, isComplete: true },
                            getStandingsSnapshot()
                        );
                    }

                    return {
                        ...round,
                        games: updatedGames,
                        isComplete: allComplete
                    };
                });

                if (anyUpdated) {
                    // Cap at 15 (start of playoffs) for regular season
                    const cappedRound = Math.min(newCurrentRound, 15);
                    set({
                        rounds: updatedRounds,
                        currentRound: cappedRound
                    });
                    console.log(`[LSHL] Catch-up complete: processed rounds up to ${cappedRound - 1}, currentRound = ${cappedRound}`);
                }
            },

            startPlayoffs: () => {
                // Get top 8 from standings
                const { teamStats } = useStandingsStore.getState();
                const standings = Array.from(teamStats.entries())
                    .map(([teamId, stats]) => ({ teamId, stats }))
                    .sort((a, b) => {
                        const aTotalGames = a.stats.wins + a.stats.losses;
                        const bTotalGames = b.stats.wins + b.stats.losses;
                        const aWinPct = aTotalGames > 0 ? a.stats.wins / aTotalGames : 0;
                        const bWinPct = bTotalGames > 0 ? b.stats.wins / bTotalGames : 0;
                        if (bWinPct !== aWinPct) return bWinPct - aWinPct;
                        // Tiebreaker: point differential
                        const aDiff = a.stats.pointsFor - a.stats.pointsAgainst;
                        const bDiff = b.stats.pointsFor - b.stats.pointsAgainst;
                        if (bDiff !== aDiff) return bDiff - aDiff;
                        return b.stats.pointsFor - a.stats.pointsFor;
                    })
                    .slice(0, 8);

                // Resolve team IDs to full Team objects using the static teams array
                const playoffTeams = standings
                    .map(s => teams.find(t => t.id === s.teamId))
                    .filter((t): t is Team => t !== undefined);

                if (playoffTeams.length < 8) {
                    console.warn('[LSHL] Could not resolve all 8 playoff teams');
                    return;
                }

                set({
                    phase: 'quarterfinals',
                    playoffTeams
                });

                get().advanceRound();
            },

            resetSeason: () => {
                useStandingsStore.getState().resetSeason();
                set(initialState);
            },
        }),
        {
            name: 'season-storage',
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const { state } = JSON.parse(str);

                    // === NON-DESTRUCTIVE MIGRATION ===
                    let migratedState = { ...state };

                    // v1 → v2: Add version field, preserve everything
                    if (!migratedState.version || migratedState.version < 2) {
                        migratedState.version = STORE_VERSION;
                        // All existing data is preserved as-is
                    }

                    // Future migrations: if (migratedState.version < 3) { ... }

                    return {
                        state: {
                            ...migratedState,
                            seasonStartDate: migratedState.seasonStartDate ? new Date(migratedState.seasonStartDate) : null,
                            calendar: migratedState.calendar?.map((d: string) => new Date(d)) || [],
                            rounds: migratedState.rounds?.map((r: any) => ({
                                ...r,
                                date: new Date(r.date)
                            })) || []
                        }
                    };
                },
                setItem: (name, value) => {
                    const { state } = value;
                    localStorage.setItem(
                        name,
                        JSON.stringify({
                            state: {
                                ...state,
                                seasonStartDate: state.seasonStartDate?.toISOString(),
                                calendar: state.calendar?.map((d: Date) => d.toISOString()),
                                rounds: state.rounds?.map((r: Round) => ({
                                    ...r,
                                    date: r.date.toISOString()
                                }))
                            }
                        })
                    );
                },
                removeItem: (name) => localStorage.removeItem(name)
            }
        }
    )
);
