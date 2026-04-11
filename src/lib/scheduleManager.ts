import { teams, Team } from '@/data/teams';

export interface ScheduleConfig {
    gameDays: number[]; // 0 = Sunday, 3 = Wednesday
    gameStartHour: number; // 20 = 8pm
    gameDurationMinutes: number; // 10 minutes
    regularSeasonRounds: number; // 14 rounds
    playoffTeams: number; // Top 8
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
    gameDays: [0, 3], // Sunday and Wednesday
    gameStartHour: 20, // 8pm
    gameDurationMinutes: 10,
    regularSeasonRounds: 14,
    playoffTeams: 8
};

export class ScheduleManager {
    private config: ScheduleConfig;
    public static SEASON_START_DATE = new Date("2026-05-06T12:00:00");

    constructor(config: ScheduleConfig = DEFAULT_SCHEDULE) {
        this.config = config;
    }

    /**
     * Check if today is a game day
     */
    isGameDay(date: Date = new Date()): boolean {
        return this.config.gameDays.includes(date.getDay());
    }

    /**
     * Check if current time is during game time (8pm - 8:10pm)
     */
    isGameTime(date: Date = new Date()): boolean {
        const hour = date.getHours();
        const minute = date.getMinutes();

        const startHour = this.config.gameStartHour;
        const endHour = startHour;
        const endMinute = this.config.gameDurationMinutes;

        // Game is from 20:00 to 20:10
        if (hour === startHour) {
            return minute < endMinute;
        }

        return false;
    }

    /**
     * Check if games should be live right now
     */
    isLiveTime(date: Date = new Date()): boolean {
        return this.isGameDay(date) && this.isGameTime(date);
    }

    /**
     * Get next game day from a given date, respecting season start
     */
    getNextGameDay(fromDate: Date = new Date(), seasonStartDate?: Date | null): Date {
        // Use provided start date OR the global constant if no data yet
        const start = seasonStartDate || ScheduleManager.SEASON_START_DATE;
        
        if (fromDate < start) {
            return new Date(start);
        }

        const next = new Date(fromDate);
        next.setHours(this.config.gameStartHour, 0, 0, 0);

        // If we're past game time today, start from tomorrow
        if (fromDate.getHours() >= this.config.gameStartHour + 1 ||
            (fromDate.getHours() === this.config.gameStartHour &&
                fromDate.getMinutes() >= this.config.gameDurationMinutes)) {
            next.setDate(next.getDate() + 1);
        }

        // Find next game day
        while (!this.config.gameDays.includes(next.getDay())) {
            next.setDate(next.getDate() + 1);
        }

        return next;
    }

    /**
     * Generate complete season calendar
     */
    generateSeasonCalendar(startDate?: Date): Date[] {
        const calendar: Date[] = [];
        let currentDate = startDate ? new Date(startDate) : this.getNextGameDay();

        // Generate regular season rounds
        for (let i = 0; i < this.config.regularSeasonRounds; i++) {
            calendar.push(new Date(currentDate));
            currentDate = this.getNextGameDay(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        }

        // Generate playoff rounds (Quarters, Semis, Finals)
        for (let i = 0; i < 3; i++) {
            calendar.push(new Date(currentDate));
            currentDate = this.getNextGameDay(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
        }

        return calendar;
    }

    /**
     * Get current round number based on date
     */
    getCurrentRound(calendar: Date[], now: Date = new Date()): number {
        for (let i = 0; i < calendar.length; i++) {
            const roundDate = calendar[i];
            const roundEnd = new Date(roundDate);
            roundEnd.setHours(this.config.gameStartHour, this.config.gameDurationMinutes, 0, 0);

            if (now < roundEnd) {
                return i + 1;
            }
        }

        // All rounds completed
        return calendar.length + 1;
    }

    /**
     * Generate matchups for a round (ensures all 20 teams play with variety)
     */
    generateRoundMatchups(roundNumber: number): Array<[Team, Team]> {
        // Use circle method for round-robin scheduling
        const teamsCopy = [...teams];
        const numTeams = teamsCopy.length;

        // For round-robin with even number of teams
        // Fix one team, rotate others
        const fixed = teamsCopy[0];
        const rotating = teamsCopy.slice(1);

        // Rotate based on round number
        const rotateAmount = (roundNumber - 1) % (numTeams - 1);
        for (let i = 0; i < rotateAmount; i++) {
            rotating.unshift(rotating.pop()!);
        }

        // Create matchups
        const matchups: Array<[Team, Team]> = [];
        matchups.push([fixed, rotating[0]]);

        for (let i = 1; i < rotating.length; i += 2) {
            matchups.push([rotating[i], rotating[i + 1]]);
        }

        return matchups;
    }

    /**
     * Generate playoff matchups based on standings
     */
    generatePlayoffMatchups(topTeams: Team[], round: 'quarters' | 'semis' | 'finals'): Array<[Team, Team]> {
        if (round === 'quarters') {
            // 1v8, 2v7, 3v6, 4v5
            return [
                [topTeams[0], topTeams[7]],
                [topTeams[1], topTeams[6]],
                [topTeams[2], topTeams[5]],
                [topTeams[3], topTeams[4]]
            ];
        } else if (round === 'semis') {
            // Winners of 1v8 vs 4v5, 2v7 vs 3v6
            return [
                [topTeams[0], topTeams[1]],
                [topTeams[2], topTeams[3]]
            ];
        } else {
            // Finals
            return [[topTeams[0], topTeams[1]]];
        }
    }

    /**
     * Calculate time until next game
     */
    getTimeUntilNextGame(now: Date = new Date(), seasonStartDate?: Date | null): {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        totalMinutes: number;
    } {
        const nextGame = this.getNextGameDay(now, seasonStartDate);
        const diff = nextGame.getTime() - now.getTime();

        const totalSeconds = Math.max(0, Math.floor(diff / 1000));
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);

        return { days, hours, minutes, seconds, totalMinutes };
    }
}

export const scheduleManager = new ScheduleManager();
