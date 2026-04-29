import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team } from '@/data/teams';
import { scheduleManager } from '@/lib/scheduleManager';
import { useStandingsStore } from './useStandingsStore';
import { newsGenerator } from '@/lib/newsGenerator';
import { seededRandom } from '@/lib/utils';
import { calculateGameState } from '@/lib/gameSimulation';

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
    startPlayoffs: () => void;
    resetSeason: () => void;
    nuclearReset: () => void;
}

const initialState: SeasonState = {
    seasonStartDate: null,
    calendar: [],
    currentRound: 1,
    phase: 'regular',
    rounds: [],
    playoffTeams: [],
    champion: null,
    runnerUp: null
};

export const useSeasonStore = create<SeasonStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            initializeSeason: async (startDate?) => {
                const desiredStart = startDate || new Date("2026-04-29T20:00:00");
                
                try {
                    // Tenta buscar do backend primeiro (opcional)
                    const response = await fetch('http://localhost:3001/season').catch(() => null);
                    const data = response ? await response.json().catch(() => ({})) : {};

                    // Se o backend retornou uma data, usa ela (prioridade)
                    const apiStartDate = data.startDate ? new Date(data.startDate) : null;
                    const finalDate = apiStartDate || desiredStart;

                    const calendar = scheduleManager.generateSeasonCalendar(finalDate);
                    const firstRoundGames = get().generateRoundGames(1);

                    set({
                        seasonStartDate: finalDate,
                        calendar,
                        currentRound: 1,
                        phase: 'regular',
                        rounds: [{
                            number: 1,
                            date: calendar[0],
                            games: firstRoundGames,
                            isComplete: false
                        }],
                        playoffTeams: [],
                        champion: null,
                        runnerUp: null
                    });

                } catch (error) {
                    // Silently fail
                }
            },

            nuclearReset: () => {
                // 1. Limpeza do LocalStorage Bruta
                localStorage.removeItem('season-storage');
                localStorage.removeItem('news-storage');
                localStorage.removeItem('standings-storage');
                
                // 2. Reset dos outros stores (se puder importar)
                // Caso contrário, o removeItem já resolve no próximo reload
                
                // 3. Reset do estado atual
                set(initialState);

                // 4. Force Reload para limpar memória do React
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

                set({
                    rounds: state.rounds.map(round => ({
                        ...round,
                        games: round.games.map(game => {
                            if (game.id === gameId) {
                                // Save to standings if regular season
                                if (state.phase === 'regular') {
                                    useStandingsStore.getState().updateGameResult(
                                        game.homeTeam.id,
                                        game.awayTeam.id,
                                        homeScore,
                                        awayScore
                                    );
                                }
                                return { ...game, isComplete: true, isLive: false, homeScore, awayScore };
                            }
                            return game;
                        })
                    }))
                });

                // Check if round is complete
                const currentRound = state.rounds.find(r => r.number === state.currentRound);
                if (currentRound && currentRound.games.every(g => g.isComplete)) {
                    set({
                        rounds: state.rounds.map(r =>
                            r.number === state.currentRound ? { ...r, isComplete: true } : r
                        )
                    });

                    // Generate news automatically when round completes
                    const { teamStats } = useStandingsStore.getState();
                    const standings = Array.from(teamStats.entries())
                        .map(([teamId, stats]) => ({ teamId, wins: stats.wins, losses: stats.losses }))
                        .sort((a, b) => {
                            const aWinPct = a.wins / (a.wins + a.losses || 1);
                            const bWinPct = b.wins / (b.wins + b.losses || 1);
                            if (bWinPct !== aWinPct) return bWinPct - aWinPct;
                            return b.wins - a.wins;
                        });

                    newsGenerator.generateNewsForRound(currentRound, standings);
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
                    // Get current standings for context
                    const { teamStats } = useStandingsStore.getState();
                    const standings = Array.from(teamStats.entries())
                        .map(([teamId, stats]) => ({ teamId, wins: stats.wins, losses: stats.losses }))
                        .sort((a, b) => {
                            const aWinPct = a.wins / (a.wins + a.losses || 1);
                            const bWinPct = b.wins / (b.wins + b.losses || 1);
                            if (bWinPct !== aWinPct) return bWinPct - aWinPct;
                            return b.wins - a.wins;
                        });

                    newsGenerator.generateNewsForRound(completedRound, standings);
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

                const nextRoundGames = get().generateRoundGames(nextRound);
                const nextRoundDate = state.calendar[nextRound - 1];

                // Determine phase
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
            },

            checkAndGenerateResults: () => {
                const state = get();
                const now = new Date();
                const currentRound = state.rounds.find(r => r.number === state.currentRound);

                if (!currentRound || currentRound.isComplete) return;

                let anyChange = false;
                const updatedGames = currentRound.games.map(game => {
                    const gameState = calculateGameState(game.id, new Date(currentRound.date), now);
                    
                    if (gameState.isFinished && !game.isComplete) {
                        anyChange = true;
                        // For auto-finalization, we simulate to ensure it's saved to standings
                        const random = seededRandom(game.id);
                        let finalHome = gameState.homeScore;
                        let finalAway = gameState.awayScore;
                        
                        // Standings update
                        if (state.phase === 'regular') {
                            useStandingsStore.getState().updateGameResult(
                                game.homeTeam.id,
                                game.awayTeam.id,
                                finalHome,
                                finalAway
                            );
                        }
                        
                        return { ...game, isComplete: true, isLive: false, homeScore: finalHome, awayScore: finalAway };
                    } else if (gameState.isLive && !game.isLive) {
                        anyChange = true;
                        return { ...game, isLive: true, homeScore: gameState.homeScore, awayScore: gameState.awayScore };
                    } else if (gameState.isLive) {
                        // Keep scores updated even if already live
                        return { ...game, homeScore: gameState.homeScore, awayScore: gameState.awayScore };
                    }
                    return game;
                });

                if (anyChange || (now.getSeconds() === 0)) { // Update store periodically or on status change
                    set({
                        rounds: state.rounds.map(r => 
                            r.number === state.currentRound 
                            ? { ...r, games: updatedGames } 
                            : r
                        )
                    });
                }

                // Check if all games are now complete
                if (updatedGames.every(g => g.isComplete) && !currentRound.isComplete) {
                    set({
                        rounds: state.rounds.map(r =>
                            r.number === state.currentRound ? { ...r, isComplete: true } : r
                        )
                    });
                    
                    // Generate news
                    const { teamStats } = useStandingsStore.getState();
                    const standings = Array.from(teamStats.entries())
                        .map(([teamId, stats]) => ({ teamId, wins: stats.wins, losses: stats.losses }))
                        .sort((a, b) => {
                            const aWinPct = a.wins / (a.wins + a.losses || 1);
                            const bWinPct = b.wins / (b.wins + b.losses || 1);
                            if (bWinPct !== aWinPct) return bWinPct - aWinPct;
                            return b.wins - a.wins;
                        });

                    newsGenerator.generateNewsForRound({ ...currentRound, games: updatedGames, isComplete: true }, standings);
                }
            },

            startPlayoffs: () => {
                // Get top 8 from standings
                const { teamStats } = useStandingsStore.getState();
                const standings = Array.from(teamStats.entries())
                    .map(([teamId, stats]) => ({ teamId, stats }))
                    .sort((a, b) => {
                        const aWinPct = a.stats.wins / (a.stats.wins + a.stats.losses);
                        const bWinPct = b.stats.wins / (b.stats.wins + b.stats.losses);
                        if (bWinPct !== aWinPct) return bWinPct - aWinPct;
                        return b.stats.wins - a.stats.wins;
                    })
                    .slice(0, 8);

                const topTeams = standings.map(s => {
                    const team = useStandingsStore.getState().teamStats.get(s.teamId);
                    return team;
                }).filter(Boolean) as any[];

                // Import teams to get full team objects
                import('@/data/teams').then(({ teams }) => {
                    const playoffTeams = topTeams.map(stat =>
                        teams.find(t => t.id === stat.teamId)
                    ).filter(Boolean) as Team[];

                    set({
                        phase: 'quarterfinals',
                        playoffTeams
                    });

                    get().advanceRound();
                });
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
                    return {
                        state: {
                            ...state,
                            seasonStartDate: state.seasonStartDate ? new Date(state.seasonStartDate) : null,
                            calendar: state.calendar?.map((d: string) => new Date(d)) || [],
                            rounds: state.rounds?.map((r: any) => ({
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
