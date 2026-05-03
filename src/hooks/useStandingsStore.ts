import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TeamStats {
    teamId: string;
    wins: number;
    losses: number;
    pointsFor: number;
    pointsAgainst: number;
    lastResults: ('W' | 'L')[];
}

interface StandingsStore {
    teamStats: Map<string, TeamStats>;
    /** 
     * CRITICAL: Tracks which game IDs have already been counted in standings.
     * This prevents duplicate stat recording on re-renders, reloads, or 
     * multiple calls to checkAndGenerateResults for the same game.
     */
    processedGameIds: Set<string>;
    updateGameResult: (gameId: string, homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number) => void;
    /**
     * Rebuilds standings from persisted round data. Called once during migration
     * when processedGameIds is empty but completed rounds exist.
     * Uses ONLY persisted scores — never re-simulates.
     */
    rebuildFromRounds: (rounds: any[]) => void;
    resetSeason: () => void;
    getTeamStats: (teamId: string) => TeamStats;
}

const createDefaultStats = (teamId: string): TeamStats => ({
    teamId,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    lastResults: []
});

export const useStandingsStore = create<StandingsStore>()(
    persist(
        (set, get) => ({
            teamStats: new Map(),
            processedGameIds: new Set(),

            updateGameResult: (gameId, homeTeamId, awayTeamId, homeScore, awayScore) => {
                set((state) => {
                    // GUARD: if this game was already processed, skip (idempotent)
                    if (state.processedGameIds.has(gameId)) return state;

                    const newStats = new Map(state.teamStats);
                    const newProcessed = new Set(state.processedGameIds);
                    newProcessed.add(gameId);

                    // Get or create stats for both teams
                    const homeStats = newStats.get(homeTeamId) || createDefaultStats(homeTeamId);
                    const awayStats = newStats.get(awayTeamId) || createDefaultStats(awayTeamId);

                    // Determine winner
                    const homeWon = homeScore > awayScore;

                    // Update home team stats
                    const updatedHomeStats: TeamStats = {
                        ...homeStats,
                        wins: homeStats.wins + (homeWon ? 1 : 0),
                        losses: homeStats.losses + (homeWon ? 0 : 1),
                        pointsFor: homeStats.pointsFor + homeScore,
                        pointsAgainst: homeStats.pointsAgainst + awayScore,
                        lastResults: [...homeStats.lastResults, homeWon ? 'W' : 'L'].slice(-5)
                    };

                    // Update away team stats
                    const updatedAwayStats: TeamStats = {
                        ...awayStats,
                        wins: awayStats.wins + (homeWon ? 0 : 1),
                        losses: awayStats.losses + (homeWon ? 1 : 0),
                        pointsFor: awayStats.pointsFor + awayScore,
                        pointsAgainst: awayStats.pointsAgainst + homeScore,
                        lastResults: [...awayStats.lastResults, homeWon ? 'L' : 'W'].slice(-5)
                    };

                    newStats.set(homeTeamId, updatedHomeStats);
                    newStats.set(awayTeamId, updatedAwayStats);

                    return { teamStats: newStats, processedGameIds: newProcessed };
                });
            },

            rebuildFromRounds: (rounds) => {
                set((state) => {
                    // If we already have processed IDs, don't rebuild — data is consistent
                    if (state.processedGameIds.size > 0) return state;

                    const newStats = new Map<string, TeamStats>();
                    const newProcessedIds = new Set<string>();

                    // Sort rounds by number to process in chronological order
                    const sortedRounds = [...rounds].sort((a, b) => a.number - b.number);

                    sortedRounds.forEach((round: any) => {
                        // Only process regular season rounds (1-14)
                        if (round.number > 14) return;

                        round.games.forEach((game: any) => {
                            if (!game.isComplete) return;
                            // Skip corrupted data (complete but both scores 0)
                            if (game.homeScore === 0 && game.awayScore === 0) return;

                            const homeTeamId = game.homeTeam.id;
                            const awayTeamId = game.awayTeam.id;

                            const homeStats = newStats.get(homeTeamId) || createDefaultStats(homeTeamId);
                            const awayStats = newStats.get(awayTeamId) || createDefaultStats(awayTeamId);

                            const homeWon = game.homeScore > game.awayScore;

                            newStats.set(homeTeamId, {
                                ...homeStats,
                                wins: homeStats.wins + (homeWon ? 1 : 0),
                                losses: homeStats.losses + (homeWon ? 0 : 1),
                                pointsFor: homeStats.pointsFor + game.homeScore,
                                pointsAgainst: homeStats.pointsAgainst + game.awayScore,
                                lastResults: [...homeStats.lastResults, homeWon ? 'W' : 'L'].slice(-5)
                            });

                            newStats.set(awayTeamId, {
                                ...awayStats,
                                wins: awayStats.wins + (homeWon ? 0 : 1),
                                losses: awayStats.losses + (homeWon ? 1 : 0),
                                pointsFor: awayStats.pointsFor + game.awayScore,
                                pointsAgainst: awayStats.pointsAgainst + game.homeScore,
                                lastResults: [...awayStats.lastResults, homeWon ? 'L' : 'W'].slice(-5)
                            });

                            newProcessedIds.add(game.id);
                        });
                    });

                    return { teamStats: newStats, processedGameIds: newProcessedIds };
                });
            },

            resetSeason: () => {
                set({ teamStats: new Map(), processedGameIds: new Set() });
            },

            getTeamStats: (teamId) => {
                const stats = get().teamStats.get(teamId);
                return stats || createDefaultStats(teamId);
            }
        }),
        {
            name: 'standings-storage',
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const { state } = JSON.parse(str);
                    return {
                        state: {
                            ...state,
                            teamStats: new Map(Object.entries(state.teamStats || {})),
                            // Migration: if processedGameIds doesn't exist yet, create empty Set.
                            // rebuildFromRounds will be triggered on first load to populate it.
                            processedGameIds: new Set(state.processedGameIds || [])
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
                                teamStats: Object.fromEntries(state.teamStats),
                                processedGameIds: Array.from(state.processedGameIds)
                            }
                        })
                    );
                },
                removeItem: (name) => localStorage.removeItem(name)
            }
        }
    )
);
