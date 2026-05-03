import { Link } from "react-router-dom";
import { teams } from "@/data/teams";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import arenaBackground from "@/assets/basketball-arena-bg.jpg";
import { useStandingsStore } from "@/hooks/useStandingsStore";
import { SiteHeader } from "@/components/SiteHeader";

interface TeamStanding {
  team: typeof teams[0];
  wins: number;
  losses: number;
  winPercentage: string;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  streak: string;
}

const Standings = () => {
  const { teamStats, resetSeason } = useStandingsStore();

  // Gerar estatísticas baseadas nos dados reais salvos
  const standings: TeamStanding[] = teams.map(team => {
    const stats = teamStats.get(team.id);

    if (!stats || (stats.wins === 0 && stats.losses === 0)) {
      // Se não houver dados, mostrar zeros
      return {
        team,
        wins: 0,
        losses: 0,
        winPercentage: "0.0",
        pointsFor: 0,
        pointsAgainst: 0,
        streak: "-"
      };
    }

    const totalGames = stats.wins + stats.losses;
    const winPercentage = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : "0.0";

    // Calcular sequência baseada nos últimos resultados
    let streak = "-";
    if (stats.lastResults.length > 0) {
      const lastResult = stats.lastResults[stats.lastResults.length - 1];
      let count = 1;
      for (let i = stats.lastResults.length - 2; i >= 0; i--) {
        if (stats.lastResults[i] === lastResult) {
          count++;
        } else {
          break;
        }
      }
      streak = `${lastResult}${count}`;
    }

    return {
      team,
      wins: stats.wins,
      losses: stats.losses,
      winPercentage,
      pointsFor: stats.pointsFor,
      pointsAgainst: stats.pointsAgainst,
      pointDiff: stats.pointsFor - stats.pointsAgainst,
      streak
    };
  }).sort((a, b) => {
    // 1. Vitórias (desc)
    if (b.wins !== a.wins) return b.wins - a.wins;
    // 2. Aproveitamento (desc)
    const aWinPct = parseFloat(a.winPercentage);
    const bWinPct = parseFloat(b.winPercentage);
    if (bWinPct !== aWinPct) return bWinPct - aWinPct;
    // 3. Saldo de pontos (desc)
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    // 4. Pontos marcados (desc)
    return b.pointsFor - a.pointsFor;
  });

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url(${arenaBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <SiteHeader showBackButton />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-8 h-8 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Classificação
                </h2>
              </div>
              <p className="text-muted-foreground">
                Temporada 2024-2025
              </p>
            </div>

            {/* Standings Table */}
            <Card className="overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-4 font-semibold text-foreground">#</th>
                      <th className="text-left p-4 font-semibold text-foreground">Time</th>
                      <th className="text-center p-4 font-semibold text-foreground">V</th>
                      <th className="text-center p-4 font-semibold text-foreground">D</th>
                      <th className="text-center p-4 font-semibold text-foreground">%</th>
                      <th className="text-center p-4 font-semibold text-foreground">PF</th>
                      <th className="text-center p-4 font-semibold text-foreground">PC</th>
                      <th className="text-center p-4 font-semibold text-foreground">DIFF</th>
                      <th className="text-center p-4 font-semibold text-foreground">Sequência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((standing, index) => (
                      <tr
                        key={standing.team.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <span className={`font-bold ${index < 3 ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {standing.team.logo ? (
                              <img
                                src={standing.team.logo}
                                alt={standing.team.name}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full"
                                style={{ backgroundColor: standing.team.color }}
                              />
                            )}
                            <div>
                              <div className="font-semibold text-foreground">
                                {standing.team.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {standing.team.shortName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center p-4 font-semibold text-foreground">
                          {standing.wins}
                        </td>
                        <td className="text-center p-4 font-semibold text-foreground">
                          {standing.losses}
                        </td>
                        <td className="text-center p-4 font-semibold text-primary">
                          {standing.winPercentage}
                        </td>
                        <td className="text-center p-4 text-muted-foreground">
                          {standing.pointsFor}
                        </td>
                        <td className="text-center p-4 text-muted-foreground">
                          {standing.pointsAgainst}
                        </td>
                        <td className="text-center p-4">
                          <span className={`font-semibold ${
                            standing.pointDiff > 0 ? 'text-green-600' : standing.pointDiff < 0 ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {standing.pointDiff > 0 ? '+' : ''}{standing.pointDiff}
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <span className={`font-semibold ${standing.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {standing.streak}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-4">
                {standings.map((standing, index) => (
                  <Card key={standing.team.id} className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-bold ${index < 3 ? 'text-primary' : 'text-muted-foreground'
                        }`}>
                        #{index + 1}
                      </span>
                      {standing.team.logo ? (
                        <img
                          src={standing.team.logo}
                          alt={standing.team.name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full"
                          style={{ backgroundColor: standing.team.color }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">
                          {standing.team.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {standing.team.shortName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {standing.winPercentage}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {standing.wins}-{standing.losses}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div className="text-muted-foreground">
                        <span className="font-semibold">PF:</span> {standing.pointsFor}
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-semibold">PC:</span> {standing.pointsAgainst}
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">DIFF:</span>{' '}
                        <span className={`font-semibold ${
                          standing.pointDiff > 0 ? 'text-green-600' : standing.pointDiff < 0 ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {standing.pointDiff > 0 ? '+' : ''}{standing.pointDiff}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">Seq:</span>{' '}
                        <span className={`font-semibold ${standing.streak.startsWith('W') ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {standing.streak}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Legend */}
            <Card className="p-4 bg-muted/30">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><span className="font-semibold">V</span> = Vitórias | <span className="font-semibold">D</span> = Derrotas | <span className="font-semibold">%</span> = Porcentagem de Vitórias</p>
                <p><span className="font-semibold">PF</span> = Pontos Feitos | <span className="font-semibold">PC</span> = Pontos Contra | <span className="font-semibold">DIFF</span> = Saldo de Pontos | <span className="font-semibold">Sequência</span> = W (vitórias) ou L (derrotas) consecutivas</p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Standings;
