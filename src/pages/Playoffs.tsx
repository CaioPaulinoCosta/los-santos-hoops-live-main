import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import logo from "@/assets/los-santos-logo.png";
import arenaBackground from "@/assets/basketball-arena-bg.jpg";
import { useSeasonStore } from "@/hooks/useSeasonStore";
import { Team } from "@/data/teams";

const Playoffs = () => {
    const { rounds, currentRound, phase, playoffTeams, champion, runnerUp } = useSeasonStore();

    // Get playoff rounds (15, 16, 17)
    const playoffRounds = rounds.filter(r => r.number >= 15 && r.number <= 17);

    const getRoundName = (roundNumber: number): string => {
        if (roundNumber === 15) return 'Quartas de Final';
        if (roundNumber === 16) return 'Semifinais';
        if (roundNumber === 17) return 'FINAL';
        return `Rodada ${roundNumber}`;
    };

    const getMatchupDisplay = (homeTeam: Team, awayTeam: Team, homeScore: number, awayScore: number, isComplete: boolean) => {
        return (
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                {/* Home Team */}
                <div className="flex items-center gap-3 flex-1">
                    {homeTeam.logo ? (
                        <img src={homeTeam.logo} alt={homeTeam.name} className="w-12 h-12 object-contain" />
                    ) : (
                        <div className="w-12 h-12 rounded-full" style={{ backgroundColor: homeTeam.color }} />
                    )}
                    <div>
                        <div className="font-bold text-foreground">{homeTeam.name}</div>
                        <div className="text-xs text-muted-foreground">{homeTeam.shortName}</div>
                    </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 px-6">
                    {isComplete ? (
                        <>
                            <span className={`text-3xl font-bold tabular-nums ${homeScore > awayScore ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                {homeScore}
                            </span>
                            <span className="text-2xl text-muted-foreground">×</span>
                            <span className={`text-3xl font-bold tabular-nums ${awayScore > homeScore ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                {awayScore}
                            </span>
                        </>
                    ) : (
                        <span className="text-lg text-muted-foreground">vs</span>
                    )}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right">
                        <div className="font-bold text-foreground">{awayTeam.name}</div>
                        <div className="text-xs text-muted-foreground">{awayTeam.shortName}</div>
                    </div>
                    {awayTeam.logo ? (
                        <img src={awayTeam.logo} alt={awayTeam.name} className="w-12 h-12 object-contain" />
                    ) : (
                        <div className="w-12 h-12 rounded-full" style={{ backgroundColor: awayTeam.color }} />
                    )}
                </div>
            </div>
        );
    };

    // Show champion screen if season is completed
    if (phase === 'completed' && champion) {
        return (
            <div className="min-h-screen bg-background relative flex items-center justify-center">
                <div
                    className="fixed inset-0 z-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url(${arenaBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                <div className="relative z-10 text-center space-y-8 max-w-3xl px-4">
                    <Trophy className="w-40 h-40 text-primary mx-auto animate-bounce" />

                    <div>
                        <h1 className="text-7xl font-bold text-primary mb-4">CAMPEÃO!</h1>
                        <p className="text-2xl text-muted-foreground mb-8">Temporada 2024-2025</p>
                    </div>

                    <div className="flex items-center justify-center gap-8 p-8 bg-card/50 backdrop-blur-sm rounded-2xl border-2 border-primary">
                        {champion.logo && (
                            <img
                                src={champion.logo}
                                alt={champion.name}
                                className="w-40 h-40 object-contain"
                            />
                        )}
                        <div className="text-left">
                            <h2 className="text-5xl font-bold text-foreground">{champion.name}</h2>
                            <p className="text-3xl text-muted-foreground mt-2">{champion.shortName}</p>
                        </div>
                    </div>

                    {runnerUp && (
                        <div className="text-center">
                            <p className="text-lg text-muted-foreground mb-2">Vice-Campeão</p>
                            <div className="flex items-center justify-center gap-4">
                                {runnerUp.logo && (
                                    <img src={runnerUp.logo} alt={runnerUp.name} className="w-12 h-12 object-contain" />
                                )}
                                <span className="text-2xl font-semibold text-foreground">{runnerUp.name}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <Link to="/standings">
                            <Button size="lg" className="gap-2">
                                <Trophy className="w-5 h-5" />
                                Ver Classificação Final
                            </Button>
                        </Link>
                        <Link to="/history">
                            <Button size="lg" variant="outline" className="gap-2">
                                Ver Histórico Completo
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show "not started" message if playoffs haven't begun
    if (phase === 'regular' || playoffRounds.length === 0) {
        return (
            <div className="min-h-screen bg-background relative">
                <div
                    className="fixed inset-0 z-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `url(${arenaBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />

                <div className="relative z-10">
                    <header className="border-b border-border bg-card/95 backdrop-blur-sm">
                        <div className="container mx-auto px-4 py-4">
                            <div className="flex items-center justify-between">
                                <Link to="/">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <ArrowLeft className="w-4 h-4" />
                                        Voltar
                                    </Button>
                                </Link>

                                <div className="flex items-center gap-3">
                                    <img src={logo} alt="Logo" className="w-12 h-12" />
                                    <div className="text-center">
                                        <h1 className="text-xl font-bold text-foreground">Playoffs</h1>
                                        <p className="text-sm text-muted-foreground">Los Santos Hoops</p>
                                    </div>
                                </div>

                                <div className="w-[100px]" />
                            </div>
                        </div>
                    </header>

                    <main className="container mx-auto px-4 py-16">
                        <Card className="max-w-2xl mx-auto p-12 text-center">
                            <Trophy className="w-24 h-24 text-muted-foreground mx-auto mb-6" />
                            <h2 className="text-3xl font-bold text-foreground mb-4">
                                Playoffs Ainda Não Começaram
                            </h2>
                            <p className="text-lg text-muted-foreground mb-2">
                                Os playoffs começam após a conclusão das 14 rodadas da temporada regular.
                            </p>
                            <p className="text-muted-foreground mb-8">
                                Rodada atual: <span className="font-bold text-primary">{currentRound}/14</span>
                            </p>
                            <Link to="/standings">
                                <Button size="lg" className="gap-2">
                                    <Trophy className="w-5 h-5" />
                                    Ver Classificação
                                </Button>
                            </Link>
                        </Card>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative">
            <div
                className="fixed inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url(${arenaBackground})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />

            <div className="relative z-10">
                <header className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-20">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link to="/">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Voltar
                                </Button>
                            </Link>

                            <div className="flex items-center gap-3">
                                <img src={logo} alt="Logo" className="w-12 h-12" />
                                <div className="text-center">
                                    <h1 className="text-xl font-bold text-foreground">Playoffs</h1>
                                    <p className="text-sm text-muted-foreground">Temporada 2024-2025</p>
                                </div>
                            </div>

                            <Badge variant="default" className="bg-primary">
                                {getRoundName(currentRound)}
                            </Badge>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Playoff Rounds */}
                        {playoffRounds.map((round) => (
                            <Card key={round.number} className="overflow-hidden">
                                <div className="p-6 bg-primary/10 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-foreground">
                                                {getRoundName(round.number)}
                                            </h2>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {new Date(round.date).toLocaleDateString('pt-BR', {
                                                    weekday: 'long',
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })} às 20:00
                                            </p>
                                        </div>
                                        {round.isComplete ? (
                                            <Badge variant="secondary">Finalizada</Badge>
                                        ) : round.number === currentRound ? (
                                            <Badge variant="default">Em Andamento</Badge>
                                        ) : (
                                            <Badge variant="outline">Agendada</Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    {round.games.map((game) => (
                                        <div key={game.id}>
                                            {getMatchupDisplay(
                                                game.homeTeam,
                                                game.awayTeam,
                                                game.homeScore,
                                                game.awayScore,
                                                game.isComplete
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}

                        {/* Top 8 Teams */}
                        {playoffTeams.length > 0 && (
                            <Card className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-4">Times Classificados</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {playoffTeams.map((team, index) => (
                                        <div key={team.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                                            <span className="text-lg font-bold text-primary">{index + 1}º</span>
                                            {team.logo ? (
                                                <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: team.color }} />
                                            )}
                                            <span className="text-sm font-semibold text-foreground">{team.shortName}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Playoffs;
