import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TournamentState, TournamentPhase, TeamStats, PlayoffBracket } from '@/lib/tournamentManager';
import { Team } from '@/data/teams';

interface TournamentStore extends TournamentState {
    // Actions
    setPhase: (phase: TournamentPhase) => void;
    setBrackets: (brackets: PlayoffBracket[]) => void;
    setChampion: (team: Team | null) => void;
    setRunnerUp: (team: Team | null) => void;
    updateTeamStats: (teamId: string, stats: TeamStats) => void;
    resetTournament: () => void;
}

const initialState: TournamentState = {
    phase: 'regular_season',
    currentRound: 0,
    brackets: [],
    champion: null,
    runnerUp: null,
    teamStats: new Map()
};

export const useTournamentStore = create<TournamentStore>()(
    persist(
        (set) => ({
            ...initialState,

            setPhase: (phase) => set({ phase }),

            setBrackets: (brackets) => set({ brackets }),

            setChampion: (team) => set({ champion: team }),

            setRunnerUp: (team) => set({ runnerUp: team }),

            updateTeamStats: (teamId, stats) => set((state) => {
                const newTeamStats = new Map(state.teamStats);
                newTeamStats.set(teamId, stats);
                return { teamStats: newTeamStats };
            }),

            resetTournament: () => set(initialState)
        }),
        {
            name: 'tournament-storage',
            // Custom serialization for Map
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
