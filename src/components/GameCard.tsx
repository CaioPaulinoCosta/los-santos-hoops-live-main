import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Team } from "@/data/teams";
import { useStandingsStore } from "@/hooks/useStandingsStore";

interface GameCardProps {
  homeTeam: Team;
  awayTeam: Team;
  gameNumber: number;
  onGameFinish?: () => void;
}

export const GameCard = ({ homeTeam, awayTeam, gameNumber, onGameFinish }: GameCardProps) => {
  const { updateGameResult } = useStandingsStore();

  // Inicializa com 0x0 no 1º quarto
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [quarter, setQuarter] = useState(1);
  const [timeLeft, setTimeLeft] = useState("02:30");
  const [lastScorer, setLastScorer] = useState<'home' | 'away' | null>(null);
  const [animateHome, setAnimateHome] = useState(false);
  const [animateAway, setAnimateAway] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  
  // Staggered Start: Cada jogo começa em um momento ligeiramente diferente (0-60s delay)
  const [startDelay, setStartDelay] = useState(Math.floor(Math.random() * 60));
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (isFinished) return;

    // Simulação de pontuação ao vivo - Mais agressiva conforme projeto PHP
    const scoreInterval = setInterval(() => {
      if (!gameStarted || isFinished) return;

      // 60% de chance de pontuar a cada 3 segundos (Math.random() > 0.40 como no PHP)
      if (Math.random() > 0.40) {
        let points: number;
        const rand = Math.random();

        // Distribuição realista
        if (rand > 0.85) points = 3;
        else if (rand <= 0.15) points = 1;
        else points = 2;

        const isHome = Math.random() > 0.5;

        if (isHome) {
          setHomeScore(prev => prev + points);
          setLastScorer('home');
          setAnimateHome(true);
          setTimeout(() => setAnimateHome(false), 400);
        } else {
          setAwayScore(prev => prev + points);
          setLastScorer('away');
          setAnimateAway(true);
          setTimeout(() => setAnimateAway(false), 400);
        }

        setTimeout(() => setLastScorer(null), 2000);
      }
    }, 3000);

    // Simulação do tempo do jogo
    const timeInterval = setInterval(() => {
      if (isFinished) return;

      if (startDelay > 0) {
        setStartDelay(d => d - 1);
        return;
      } else if (!gameStarted) {
        setGameStarted(true);
      }

      setTimeLeft(prev => {
        const [min, sec] = prev.split(':').map(Number);
        let totalSec = min * 60 + sec - 1;

        if (totalSec < 0) {
          if (quarter < 4) {
            setQuarter(q => q + 1);
            return "02:30";
          } else {
            setIsFinished(true);
            onGameFinish?.();
            return "00:00";
          }
        }

        const newMin = Math.floor(totalSec / 60);
        const newSec = totalSec % 60;
        return `${String(newMin).padStart(2, '0')}:${String(newSec).padStart(2, '0')}`;
      });
    }, 1000);

    return () => {
      clearInterval(scoreInterval);
      clearInterval(timeInterval);
    };
  }, [quarter, isFinished, onGameFinish]);

  // Save game result when finished
  useEffect(() => {
    if (isFinished && !resultSaved) {
      updateGameResult(homeTeam.id, awayTeam.id, homeScore, awayScore);
      setResultSaved(true);
    }
  }, [isFinished, resultSaved, homeTeam.id, awayTeam.id, homeScore, awayScore, updateGameResult]);

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
                <div className="text-xs text-primary font-mono tracking-tighter">Inicia em {startDelay}s</div>
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
          <div className={`text-4xl font-bold text-foreground tabular-nums transition-all ${animateAway ? 'animate-score-update scale-110' : ''
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
          <div className={`text-4xl font-bold text-foreground tabular-nums transition-all ${animateHome ? 'animate-score-update scale-110' : ''
            }`}>
            {homeScore}
          </div>
        </div>
      </div>
    </Card>
  );
};
