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
    updateGameResult: (homeTeamId: string, awayTeamId: string, homeScore: number, awayScore: number) => void;
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

            updateGameResult: (homeTeamId, awayTeamId, homeScore, awayScore) => {
                set((state) => {
                    const newStats = new Map(state.teamStats);

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

                    return { teamStats: newStats };
                });
            },

            resetSeason: () => {
                set({ teamStats: new Map() });
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
                            teamStats: new Map(Object.entries(state.teamStats || {}))
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
                                teamStats: Object.fromEntries(state.teamStats)
                            }
                        })
                    );
                },
                removeItem: (name) => localStorage.removeItem(name)
            }
        }
    )
);
