import { seededRandom } from './utils';
import { Game } from '@/hooks/useSeasonStore';

export interface GameState {
    homeScore: number;
    awayScore: number;
    quarter: number;
    timeLeft: string;
    isLive: boolean;
    isFinished: boolean;
}

export const GAME_DURATION_MINUTES = 10;
export const QUARTER_DURATION_SECONDS = 150; // 2.5 minutes per quarter

/**
 * Calculates the exact state of a game at any given time deterministically.
 * This ensures that for the same game and same timestamp, the result is ALWAYS the same.
 */
export function calculateGameState(gameId: string, scheduledDate: Date, now: Date): GameState {
    const totalDurationSeconds = GAME_DURATION_MINUTES * 60;
    const secondsElapsed = Math.floor((now.getTime() - scheduledDate.getTime()) / 1000);

    // Game hasn't started yet
    if (secondsElapsed < 0) {
        return {
            homeScore: 0,
            awayScore: 0,
            quarter: 1,
            timeLeft: "02:30",
            isLive: false,
            isFinished: false
        };
    }

    // Game is finished
    if (secondsElapsed >= totalDurationSeconds) {
        const finalHome = calculateDeterministicScore(gameId, 'home', totalDurationSeconds);
        const finalAway = calculateDeterministicScore(gameId, 'away', totalDurationSeconds);
        
        // Ensure no ties deterministically
        let adjustedHome = finalHome;
        let adjustedAway = finalAway;
        if (adjustedHome === adjustedAway) {
            const tieBreaker = seededRandom(gameId + "-tie")();
            if (tieBreaker > 0.5) adjustedHome++; else adjustedAway++;
        }

        return {
            homeScore: adjustedHome,
            awayScore: adjustedAway,
            quarter: 4,
            timeLeft: "00:00",
            isLive: false,
            isFinished: true
        };
    }

    // Game is LIVE
    const homeScore = calculateDeterministicScore(gameId, 'home', secondsElapsed);
    const awayScore = calculateDeterministicScore(gameId, 'away', secondsElapsed);
    
    const quarter = Math.min(4, Math.floor(secondsElapsed / QUARTER_DURATION_SECONDS) + 1);
    const secondsInQuarter = secondsElapsed % QUARTER_DURATION_SECONDS;
    const timeLeftInSeconds = QUARTER_DURATION_SECONDS - secondsInQuarter;
    
    const min = Math.floor(timeLeftInSeconds / 60);
    const sec = timeLeftInSeconds % 60;
    const timeLeft = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

    return {
        homeScore,
        awayScore,
        quarter,
        timeLeft,
        isLive: true,
        isFinished: false
    };
}

/**
 * Calculates a team's score at a specific second using a seeded random sequence.
 */
function calculateDeterministicScore(gameId: string, teamType: 'home' | 'away', seconds: number): number {
    const rng = seededRandom(`${gameId}-${teamType}`);
    let score = 0;
    
    // We iterate through every second to ensure the score "grows" consistently.
    // Since games are short (600s), this is extremely fast.
    for (let i = 0; i <= seconds; i++) {
        const scoreChance = rng();
        // ~4.5% chance to score something each second (roughly 27 scoring events per game)
        if (scoreChance < 0.045) {
            const pointsChance = rng();
            if (pointsChance > 0.85) score += 3;
            else if (pointsChance < 0.15) score += 1;
            else score += 2;
        }
    }
    
    return score;
}
