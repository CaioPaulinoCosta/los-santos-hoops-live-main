import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Team } from "@/data/teams";
import { useStandingsStore } from "@/hooks/useStandingsStore";
import { useSeasonStore } from "@/hooks/useSeasonStore";
import { calculateGameState } from "@/lib/gameSimulation";

interface GameCardProps {
  homeTeam: Team;
  awayTeam: Team;
  gameNumber: number;
  onGameFinish?: () => void;
}

export const GameCard = ({ homeTeam, awayTeam, gameNumber, onGameFinish }: GameCardProps) => {
  const { updateGameResult } = useStandingsStore();

  const { rounds, currentRound } = useSeasonStore();
  const currentRoundData = rounds.find(r => r.number === currentRound);
  const scheduledDate = currentRoundData ? new Date(currentRoundData.date) : new Date();

  const [gameState, setGameState] = useState(() => 
    calculateGameState(homeTeam.id + awayTeam.id, scheduledDate, new Date())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const newState = calculateGameState(homeTeam.id + awayTeam.id, scheduledDate, new Date());
      setGameState(newState);
      
      if (newState.isFinished && !gameState.isFinished) {
        onGameFinish?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [homeTeam.id, awayTeam.id, scheduledDate, onGameFinish, gameState.isFinished]);

  const { homeScore, awayScore, quarter, timeLeft, isLive, isFinished } = gameState;
  const gameStarted = isLive || isFinished;
  
  // Last scorer logic (visual only, can be slightly random or deterministic)
  const [lastScorer, setLastScorer] = useState<'home' | 'away' | null>(null);
  const [prevHomeScore, setPrevHomeScore] = useState(homeScore);
  const [prevAwayScore, setPrevAwayScore] = useState(awayScore);

  useEffect(() => {
    if (homeScore > prevHomeScore) {
      setLastScorer('home');
      setPrevHomeScore(homeScore);
      setTimeout(() => setLastScorer(null), 2000);
    }
    if (awayScore > prevAwayScore) {
      setLastScorer('away');
      setPrevAwayScore(awayScore);
      setTimeout(() => setLastScorer(null), 2000);
    }
  }, [homeScore, awayScore, prevHomeScore, prevAwayScore]);

  const winner = isFinished
    ? homeScore > awayScore
      ? homeTeam
      : awayScore > homeScore
        ? awayTeam
        : null
    : null;

  return (
    <Card className="relative overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300">
      <div className="p-6 space-y-4">
        {/* Header com info do jogo */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">
              JOGO {gameNumber}
            </span>
            {isFinished ? (
              <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5">
                FINALIZADO
              </Badge>
            ) : !gameStarted ? (
              <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-[10px] px-2 py-0.5 uppercase">
                Em Breve
              </Badge>
            ) : (
              <Badge variant="default" className="bg-accent text-accent-foreground glow-accent text-[10px] px-2 py-0.5">
                LIVE
              </Badge>
            )}
          </div>
          <div className="text-center">
            {!gameStarted && !isFinished ? (
              <>
                <div className="text-sm font-bold text-muted-foreground uppercase">Aguardando</div>
                <div className="text-xs text-primary font-mono tracking-tighter">Em breve</div>
              </>
            ) : isFinished ? (
              <div className="text-sm font-bold text-muted-foreground">FINAL</div>
            ) : (
              <>
                <div className="text-sm font-bold text-primary">{quarter}º QUARTO</div>
                <div className="text-xs text-muted-foreground">{timeLeft}</div>
              </>
            )}
          </div>
        </div>

        {/* Indicador de vencedor */}
        {winner && (
          <div className="text-center py-2">
            <span className="text-sm font-bold text-accent">
              🏆 Vencedor: {winner.name}
            </span>
          </div>
        )}

        {/* Time Visitante */}
        <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${lastScorer === 'away'
          ? 'bg-primary/20 border-2 border-primary glow-primary'
          : 'bg-secondary/50 hover:bg-secondary border-2 border-transparent'
          }`}>
          <div className="flex items-center gap-3">
            {awayTeam.logo ? (
              <img src={awayTeam.logo} alt={awayTeam.name} className="w-12 h-12 object-contain" />
            ) : (
              <div
                className="w-12 h-12 rounded-full"
                style={{ backgroundColor: awayTeam.color }}
              />
            )}
            <div>
              <div className="font-bold text-foreground">{awayTeam.name}</div>
              <div className="text-xs text-muted-foreground">{awayTeam.shortName}</div>
            </div>
          </div>
          <div className={`text-4xl font-bold text-foreground tabular-nums transition-all ${lastScorer === 'away' ? 'animate-score-update scale-110' : ''
            }`}>
            {awayScore}
          </div>
        </div>

        {/* Time Casa */}
        <div className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${lastScorer === 'home'
          ? 'bg-primary/20 border-2 border-primary glow-primary'
          : 'bg-secondary/50 hover:bg-secondary border-2 border-transparent'
          }`}>
          <div className="flex items-center gap-3">
            {homeTeam.logo ? (
              <img src={homeTeam.logo} alt={homeTeam.name} className="w-12 h-12 object-contain" />
            ) : (
              <div
                className="w-12 h-12 rounded-full"
                style={{ backgroundColor: homeTeam.color }}
              />
            )}
            <div>
              <div className="font-bold text-foreground">{homeTeam.name}</div>
              <div className="text-xs text-muted-foreground">{homeTeam.shortName}</div>
            </div>
          </div>
          <div className={`text-4xl font-bold text-foreground tabular-nums transition-all ${lastScorer === 'home' ? 'animate-score-update scale-110' : ''
            }`}>
            {homeScore}
          </div>
        </div>
      </div>
    </Card>
  );
};
