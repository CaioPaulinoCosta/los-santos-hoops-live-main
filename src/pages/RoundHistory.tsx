import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, CheckCircle2, Clock } from "lucide-react";
import logo from "@/assets/los-santos-logo.png";
import arenaBackground from "@/assets/basketball-arena-bg.jpg";
import { useSeasonStore } from "@/hooks/useSeasonStore";

const RoundHistory = () => {
    const { rounds, currentRound, phase } = useSeasonStore();

    const getRoundName = (roundNumber: number): string => {
        if (roundNumber <= 14) return `Rodada ${roundNumber}`;
        if (roundNumber === 15) return "Quartas de Final";
        if (roundNumber === 16) return "Semifinais";
        if (roundNumber === 17) return "FINAL";
        return `Rodada ${roundNumber}`;
    };

    const formatDate = (date: Date): string => {
        const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        return `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]} - 20:00`;
    };

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

                            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <img src={logo} alt="Logo" className="w-12 h-12 md:w-14 md:h-14" />
                                <div className="text-center">
                                    <h1 className="text-lg md:text-xl font-bold text-foreground">
                                        Histórico de Rodadas
                                    </h1>
                                    <p className="text-xs md:text-sm text-muted-foreground">
                                        Temporada 2024-2025
                                    </p>
                                </div>
                            </Link>

                            <div className="w-[100px]" />
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Current Phase Info */}
                        <Card className="p-6 bg-primary/10 border-primary/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-1">
                                        {phase === 'regular' ? 'Temporada Regular' :
                                            phase === 'quarterfinals' ? 'Playoffs - Quartas' :
                                                phase === 'semifinals' ? 'Playoffs - Semifinais' :
                                                    phase === 'finals' ? 'Playoffs - Final' : 'Temporada Encerrada'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {rounds.length} rodada{rounds.length !== 1 ? 's' : ''} disputada{rounds.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-primary">{currentRound}</div>
                                    <div className="text-sm text-muted-foreground">Rodada Atual</div>
                                </div>
                            </div>
                        </Card>

                        {/* Rounds List */}
                        <div className="space-y-4">
                            {rounds.length === 0 ? (
                                <Card className="p-8 text-center">
                                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        Nenhuma rodada disputada ainda
                                    </h3>
                                    <p className="text-muted-foreground">
                                        As rodadas aparecerão aqui conforme forem sendo jogadas
                                    </p>
                                </Card>
                            ) : (
                                rounds.map((round) => (
                                    <Card key={round.number} className="overflow-hidden">
                                        <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl font-bold text-primary">
                                                    {round.number}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-foreground">
                                                        {getRoundName(round.number)}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(round.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            {round.isComplete ? (
                                                <Badge variant="secondary" className="gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Finalizada
                                                </Badge>
                                            ) : round.number === currentRound ? (
                                                <Badge variant="default" className="gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Em Andamento
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Agendada</Badge>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-3">
                                            {round.games.map((game) => (
                                                <div
                                                    key={game.id}
                                                    className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                                                >
                                                    {/* Away Team */}
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {game.awayTeam.logo ? (
                                                            <img
                                                                src={game.awayTeam.logo}
                                                                alt={game.awayTeam.name}
                                                                className="w-8 h-8 object-contain"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="w-8 h-8 rounded-full"
                                                                style={{ backgroundColor: game.awayTeam.color }}
                                                            />
                                                        )}
                                                        <span className="font-semibold text-foreground text-sm">
                                                            {game.awayTeam.shortName}
                                                        </span>
                                                    </div>

                                                    {/* Score */}
                                                    <div className="flex items-center gap-3 px-4">
                                                        {game.isComplete ? (
                                                            <>
                                                                <span className={`text-xl font-bold tabular-nums ${game.awayScore > game.homeScore ? 'text-primary' : 'text-muted-foreground'
                                                                    }`}>
                                                                    {game.awayScore}
                                                                </span>
                                                                <span className="text-muted-foreground">×</span>
                                                                <span className={`text-xl font-bold tabular-nums ${game.homeScore > game.awayScore ? 'text-primary' : 'text-muted-foreground'
                                                                    }`}>
                                                                    {game.homeScore}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">vs</span>
                                                        )}
                                                    </div>

                                                    {/* Home Team */}
                                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                                        <span className="font-semibold text-foreground text-sm">
                                                            {game.homeTeam.shortName}
                                                        </span>
                                                        {game.homeTeam.logo ? (
                                                            <img
                                                                src={game.homeTeam.logo}
                                                                alt={game.homeTeam.name}
                                                                className="w-8 h-8 object-contain"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="w-8 h-8 rounded-full"
                                                                style={{ backgroundColor: game.homeTeam.color }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default RoundHistory;
