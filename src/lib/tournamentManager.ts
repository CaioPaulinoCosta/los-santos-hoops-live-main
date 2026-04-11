import { Team } from "@/data/teams";

export type TournamentPhase =
    | 'regular_season'
    | 'round_of_16'
    | 'quarterfinals'
    | 'semifinals'
    | 'finals'
    | 'completed';

export interface TeamStats {
    team: Team;
    regularSeason: {
        wins: number;
        losses: number;
        pointsFor: number;
        pointsAgainst: number;
    };
    playoffs: {
        wins: number;
        losses: number;
        currentRound: string | null;
        eliminated: boolean;
    };
}

export interface PlayoffBracket {
    round: TournamentPhase;
    matchNumber: number;
    team1: Team | null;
    team2: Team | null;
    winner: Team | null;
    score1: number;
    score2: number;
    isComplete: boolean;
}

export interface TournamentState {
    phase: TournamentPhase;
    currentRound: number;
    brackets: PlayoffBracket[];
    champion: Team | null;
    runnerUp: Team | null;
    teamStats: Map<string, TeamStats>;
}

export class TournamentManager {
    private state: TournamentState;

    constructor() {
        this.state = {
            phase: 'regular_season',
            currentRound: 0,
            brackets: [],
            champion: null,
            runnerUp: null,
            teamStats: new Map()
        };
    }

    // Initialize team stats
    initializeTeamStats(teams: Team[]): void {
        teams.forEach(team => {
            this.state.teamStats.set(team.id, {
                team,
                regularSeason: {
                    wins: 0,
                    losses: 0,
                    pointsFor: 0,
                    pointsAgainst: 0
                },
                playoffs: {
                    wins: 0,
                    losses: 0,
                    currentRound: null,
                    eliminated: false
                }
            });
        });
    }

    // Record regular season game result
    recordGameResult(team1Id: string, team2Id: string, score1: number, score2: number): void {
        const team1Stats = this.state.teamStats.get(team1Id);
        const team2Stats = this.state.teamStats.get(team2Id);

        if (!team1Stats || !team2Stats) return;

        team1Stats.regularSeason.pointsFor += score1;
        team1Stats.regularSeason.pointsAgainst += score2;
        team2Stats.regularSeason.pointsFor += score2;
        team2Stats.regularSeason.pointsAgainst += score1;

        if (score1 > score2) {
            team1Stats.regularSeason.wins++;
            team2Stats.regularSeason.losses++;
        } else {
            team2Stats.regularSeason.wins++;
            team1Stats.regularSeason.losses++;
        }
    }

    // Get standings sorted by win percentage
    getStandings(): TeamStats[] {
        const standings = Array.from(this.state.teamStats.values());
        return standings.sort((a, b) => {
            const totalA = a.regularSeason.wins + a.regularSeason.losses;
            const totalB = b.regularSeason.wins + b.regularSeason.losses;
            const pctA = totalA > 0 ? a.regularSeason.wins / totalA : 0;
            const pctB = totalB > 0 ? b.regularSeason.wins / totalB : 0;
            return pctB - pctA;
        });
    }

    // Generate playoff brackets (top 16 teams)
    generatePlayoffBrackets(): PlayoffBracket[] {
        const standings = this.getStandings();
        const top16 = standings.slice(0, 16);

        // NBA-style seeding: 1v16, 2v15, 3v14, etc.
        const brackets: PlayoffBracket[] = [];
        for (let i = 0; i < 8; i++) {
            brackets.push({
                round: 'round_of_16',
                matchNumber: i + 1,
                team1: top16[i].team,
                team2: top16[15 - i].team,
                winner: null,
                score1: 0,
                score2: 0,
                isComplete: false
            });
        }

        this.state.brackets = brackets;
        this.state.phase = 'round_of_16';
        return brackets;
    }

    // Record playoff game result and advance winner
    recordPlayoffResult(matchNumber: number, score1: number, score2: number): void {
        const bracket = this.state.brackets.find(
            b => b.matchNumber === matchNumber && b.round === this.state.phase
        );

        if (!bracket || !bracket.team1 || !bracket.team2) return;

        bracket.score1 = score1;
        bracket.score2 = score2;
        bracket.winner = score1 > score2 ? bracket.team1 : bracket.team2;
        bracket.isComplete = true;

        // Update playoff stats
        const winner = bracket.winner;
        const loser = score1 > score2 ? bracket.team2 : bracket.team1;

        const winnerStats = this.state.teamStats.get(winner.id);
        const loserStats = this.state.teamStats.get(loser.id);

        if (winnerStats) {
            winnerStats.playoffs.wins++;
            winnerStats.playoffs.currentRound = this.state.phase;
        }

        if (loserStats) {
            loserStats.playoffs.losses++;
            loserStats.playoffs.eliminated = true;
        }
    }

    // Check if current round is complete
    isRoundComplete(): boolean {
        const currentRoundBrackets = this.state.brackets.filter(
            b => b.round === this.state.phase
        );
        return currentRoundBrackets.every(b => b.isComplete);
    }

    // Generate next round matchups
    generateNextRound(): PlayoffBracket[] {
        if (!this.isRoundComplete()) return [];

        const currentRoundBrackets = this.state.brackets.filter(
            b => b.round === this.state.phase
        );

        const winners = currentRoundBrackets
            .sort((a, b) => a.matchNumber - b.matchNumber)
            .map(b => b.winner)
            .filter((w): w is Team => w !== null);

        let nextPhase: TournamentPhase;
        switch (this.state.phase) {
            case 'round_of_16':
                nextPhase = 'quarterfinals';
                break;
            case 'quarterfinals':
                nextPhase = 'semifinals';
                break;
            case 'semifinals':
                nextPhase = 'finals';
                break;
            case 'finals':
                nextPhase = 'completed';
                if (winners.length === 1) {
                    this.state.champion = winners[0];
                    const finalBracket = currentRoundBrackets[0];
                    this.state.runnerUp = finalBracket.winner?.id === finalBracket.team1?.id
                        ? finalBracket.team2
                        : finalBracket.team1;
                }
                return [];
            default:
                return [];
        }

        const nextBrackets: PlayoffBracket[] = [];
        for (let i = 0; i < winners.length; i += 2) {
            nextBrackets.push({
                round: nextPhase,
                matchNumber: (i / 2) + 1,
                team1: winners[i],
                team2: winners[i + 1] || null,
                winner: null,
                score1: 0,
                score2: 0,
                isComplete: false
            });
        }

        this.state.brackets.push(...nextBrackets);
        this.state.phase = nextPhase;
        this.state.currentRound++;

        return nextBrackets;
    }

    // Get current state
    getState(): TournamentState {
        return this.state;
    }

    // Load state from storage
    loadState(state: TournamentState): void {
        this.state = state;
    }
}

// Singleton instance
export const tournamentManager = new TournamentManager();
