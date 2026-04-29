import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GameCard } from "@/components/GameCard";
import { NoGamesView } from "@/components/NoGamesView";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import arenaBackground from "@/assets/basketball-arena-bg.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { useSeasonStore } from "@/hooks/useSeasonStore";
import { scheduleManager } from "@/lib/scheduleManager";

const Index = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [finishedGames, setFinishedGames] = useState<Set<string>>(new Set());

  const {
    rounds,
    currentRound,
    phase,
    champion,
    initializeSeason,
    checkAndGenerateResults,
    advanceRound
  } = useSeasonStore();


  // Initialize season if needed
  useEffect(() => {
    const desiredStart = new Date("2026-04-29T21:30:00-03:00");
    
    if (rounds.length === 0) {
      initializeSeason(desiredStart);
    }
  }, [rounds.length, initializeSeason]);

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check for automatic result generation every minute
  useEffect(() => {
    const checkInterval = setInterval(() => {
      checkAndGenerateResults();
    }, 5000); // Every 5 seconds for better responsiveness

    return () => clearInterval(checkInterval);
  }, [checkAndGenerateResults]);



  const isLiveTime = scheduleManager.isLiveTime();
  const currentRoundData = rounds.find(r => r.number === currentRound);

  // Check if all games in current round are finished
  useEffect(() => {
    if (currentRoundData && currentRoundData.isComplete) {
      // Auto-advance to next round after 1 minute of completion (as requested)
      const timer = setTimeout(() => {
        advanceRound();
      }, 60 * 1000); 

      return () => clearTimeout(timer);
    }
  }, [currentRoundData?.isComplete]);

  const handleGameFinish = (gameId: string) => {
    setFinishedGames(prev => new Set(prev).add(gameId));
  };

  // Show champion screen if season is completed
  if (phase === 'completed' && champion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${arenaBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1
          }}
        />

        {/* Confetti/Celebration Effect Overlay could go here */}

        <div className="relative z-10 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-1000 max-w-4xl w-full">

          <div className="space-y-6 text-center">
            <div className="relative inline-block">
              <Trophy className="w-40 h-40 text-yellow-500 mx-auto drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-bounce" />
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground font-bold px-4 py-1 rounded-full rotate-12 shadow-lg border border-yellow-400">
                VENCEDOR
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 drop-shadow-sm tracking-tighter uppercase">
                CAMPEÃO!
              </h1>
              <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">Temporada Encerrada</p>
            </div>

            <div className="bg-card/80 backdrop-blur-xl border border-yellow-500/30 p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500 group">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                {champion.logo ? (
                  <img
                    src={champion.logo}
                    alt={champion.name}
                    className="w-48 h-48 object-contain drop-shadow-2xl group-hover:rotate-6 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-24 h-24 text-primary" />
                  </div>
                )}

                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-5xl font-bold text-foreground tracking-tight leading-none">{champion.name}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <Badge variant="outline" className="text-xl px-4 py-1 border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                      {champion.shortName}
                    </Badge>
                    {champion.color && (
                      <div className="w-6 h-6 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: champion.color }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-8">
            <Link to="/standings">
              <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold gap-3 shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-1">
                <Trophy className="w-6 h-6" />
                Ver Classificação Final
              </Button>
            </Link>

            </div>
        </div>
      </div>
    );
  }

  // Show live games if it's game time AND it's the scheduled day for this round
  const isToday = currentRoundData && new Date(currentRoundData.date).toDateString() === new Date().toDateString();
  
  if (isLiveTime && isToday && currentRoundData) {
    const allGamesFinished = currentRoundData.isComplete;

    return (
      <div className="min-h-screen bg-background relative">
        <div
          className="fixed inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: `url(${arenaBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        <div className="relative z-10">
          <SiteHeader
            currentTime={currentTime}
            isLive={true}
            allGamesFinished={allGamesFinished}
          />

          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">
                  {phase === 'regular' ? `Rodada ${currentRound}/14` :
                    phase === 'quarterfinals' ? 'Quartas de Final' :
                      phase === 'semifinals' ? 'Semifinais' :
                        'FINAL'}
                </h2>
                <Badge variant="outline">
                  {phase === 'regular' ? 'Temporada Regular' : 'Playoffs'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Acompanhe todos os jogos ao vivo da rodada
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentRoundData.games.map((game) => (
                <GameCard
                  key={game.id}
                  homeTeam={game.homeTeam}
                  awayTeam={game.awayTeam}
                  gameNumber={parseInt(game.id.split('-g')[1] || game.id.split('-')[1] || '1')}
                  onGameFinish={() => handleGameFinish(game.id)}
                />
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show "no games" view
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
        <SiteHeader currentTime={currentTime} />

        <main>
          <NoGamesView />
        </main>
      </div>

    </div>
  );
};

export default Index;
