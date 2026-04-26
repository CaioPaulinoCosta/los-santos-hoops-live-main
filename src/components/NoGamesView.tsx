import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Medal } from "lucide-react";
import { NextGameCountdown } from "./NextGameCountdown";
import { useSeasonStore } from "@/hooks/useSeasonStore";
import { useStandingsStore } from "@/hooks/useStandingsStore";
import { teams } from "@/data/teams";

export const NoGamesView = () => {
    const { currentRound, phase, rounds } = useSeasonStore();
    const { teamStats } = useStandingsStore();

    // Get current round games
    const currentRoundData = rounds.find(r => r.number === currentRound);
    const upcomingGames = currentRoundData ? currentRoundData.games : [];

    // Check if we are in playoffs
    const isPlayoffs = phase === 'quarterfinals' || phase === 'semifinals' || phase === 'finals' || phase === 'completed';

    // Get previous playoff results for bracket view
    const qfRound = rounds.find(r => r.number === 15);
    const sfRound = rounds.find(r => r.number === 16);

    // Get top 5 teams for preview
    const topTeams = teams
        .map(team => {
            const stats = teamStats.get(team.id);
            if (!stats || (stats.wins === 0 && stats.losses === 0)) {
                return { team, wins: 0, losses: 0, winPct: 0 };
            }
            const totalGames = stats.wins + stats.losses;
            const winPct = totalGames > 0 ? (stats.wins / totalGames) * 100 : 0;
            return { team, wins: stats.wins, losses: stats.losses, winPct };
        })
        .sort((a, b) => {
            if (b.winPct !== a.winPct) return b.winPct - a.winPct;
            return b.wins - a.wins;
        })
        .slice(0, 5);

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Season Progress */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                    {phase === 'finals' ? <Trophy className="w-4 h-4 text-yellow-500" /> : <Calendar className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm font-semibold text-foreground">
                        {phase === 'regular' ? `Rodada ${currentRound}/14` :
                            phase === 'quarterfinals' ? 'Playoffs - Quartas de Final' :
                                phase === 'semifinals' ? 'Playoffs - Semifinais' :
                                    phase === 'finals' ? 'A GRANDE FINAL' : 'Temporada Encerrada'}
                    </span>
                </div>
                <h2 className="text-4xl font-black text-foreground tracking-tight uppercase">
                    {phase === 'finals' ? 'O Dia da Decisão' : 'Não há jogos agora'}
                </h2>
                <p className="text-muted-foreground">
                    Início da temporada em <span className="text-primary font-bold">29 de Abril de 2026</span> às 20:00
                </p>
            </div>

            {/* Countdown */}
            <NextGameCountdown />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Upcoming Games */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2 tracking-tight uppercase">
                            <Calendar className="w-5 h-5 text-primary" />
                            {phase === 'finals' ? 'Confronto Final' : 'Jogos da Próxima Rodada'}
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {upcomingGames.map((game, index) => (
                            <div key={game.id} className={`flex items-center justify-between p-4 glass rounded-xl transition-all duration-300 hover:scale-[1.02] ${phase === 'finals' ? 'border-primary/50 bg-primary/5 p-6 shadow-2xl' : 'hover:border-primary/40'}`}>
                                <div className="flex items-center gap-3 w-1/3">
                                    {game.homeTeam.logo ? (
                                        <img src={game.homeTeam.logo} alt={game.homeTeam.name} className={`${phase === 'finals' ? 'w-16 h-16' : 'w-8 h-8'} object-contain`} />
                                    ) : (
                                        <div className={`${phase === 'finals' ? 'w-16 h-16' : 'w-8 h-8'} rounded-full flex-shrink-0`} style={{ backgroundColor: game.homeTeam.color }} />
                                    )}
                                    <span className={`font-semibold ${phase === 'finals' ? 'text-lg' : 'text-sm md:text-base'} truncate`}>{game.homeTeam.name}</span>
                                </div>

                                <div className="text-center w-1/3 flex flex-col items-center">
                                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">VS</span>
                                    {phase === 'finals' && <span className="text-xs text-primary mt-2 font-bold uppercase tracking-wider">Disputa de Título</span>}
                                </div>

                                <div className="flex items-center justify-end gap-3 w-1/3">
                                    <span className={`font-semibold ${phase === 'finals' ? 'text-lg' : 'text-sm md:text-base'} truncate text-right`}>{game.awayTeam.name}</span>
                                    {game.awayTeam.logo ? (
                                        <img src={game.awayTeam.logo} alt={game.awayTeam.name} className={`${phase === 'finals' ? 'w-16 h-16' : 'w-8 h-8'} object-contain`} />
                                    ) : (
                                        <div className={`${phase === 'finals' ? 'w-16 h-16' : 'w-8 h-8'} rounded-full flex-shrink-0`} style={{ backgroundColor: game.awayTeam.color }} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {upcomingGames.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                                Nenhum jogo agendado para esta rodada.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Standings OR Playoff Recap */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                            {isPlayoffs ? <Medal className="w-5 h-5 text-primary" /> : <Trophy className="w-5 h-5 text-primary" />}
                            {isPlayoffs ? 'Caminho até a Final' : 'Classificação Top 5'}
                        </h3>
                        {!isPlayoffs && (
                            <Link to="/standings">
                                <Button variant="outline" size="sm" className="gap-2">
                                    Ver Completa
                                </Button>
                            </Link>
                        )}
                    </div>

                    {isPlayoffs ? (
                        <div className="space-y-4">
                            {/* SF Results if available */}
                            {sfRound && sfRound.games.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Semifinais (Resultados)</h4>
                                    {sfRound.games.map(g => (
                                        <div key={g.id} className="text-sm border border-border/50 rounded p-2 flex justify-between items-center opacity-75">
                                            <span className={g.homeScore > g.awayScore ? 'font-bold text-primary' : ''}>{g.homeTeam.shortName} ({g.homeScore})</span>
                                            <span className="text-xs text-muted-foreground">vs</span>
                                            <span className={g.awayScore > g.homeScore ? 'font-bold text-primary' : ''}>{g.awayTeam.shortName} ({g.awayScore})</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* QF Results if available (only show if space allows or no SF yet) */}
                            {(!sfRound || sfRound.games.length === 0) && qfRound && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Quartas de Final</h4>
                                    {qfRound.games.map(g => (
                                        <div key={g.id} className="text-sm border border-border/50 rounded p-2 flex justify-between items-center opacity-75">
                                            <span className={g.homeScore > g.awayScore ? 'font-bold text-primary' : ''}>{g.homeTeam.shortName} {g.isComplete && `(${g.homeScore})`}</span>
                                            <span className="text-xs text-muted-foreground">vs</span>
                                            <span className={g.awayScore > g.homeScore ? 'font-bold text-primary' : ''}>{g.awayTeam.shortName} {g.isComplete && `(${g.awayScore})`}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {phase === 'finals' && (
                                <div className="p-4 bg-muted/20 rounded-lg text-center text-sm text-muted-foreground italic">
                                    A temporada regular definiu os seeds, mas nos Playoffs, tudo pode acontecer!
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {topTeams.map((item, index) => (
                                <div
                                    key={item.team.id}
                                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                    <span className={`text-lg font-bold w-6 ${index < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {index + 1}
                                    </span>
                                    {item.team.logo ? (
                                        <img src={item.team.logo} alt={item.team.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full" style={{ backgroundColor: item.team.color }} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-foreground truncate">{item.team.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.team.shortName}</div>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <div className="text-sm font-bold text-primary">{item.winPct.toFixed(0)}%</div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.wins}-{item.losses}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
