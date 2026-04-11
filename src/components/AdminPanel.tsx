import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, FastForward, X } from "lucide-react";
import { useSeasonStore } from "@/hooks/useSeasonStore";
import { scheduleManager } from "@/lib/scheduleManager";

export const AdminPanel = ({ onClose }: { onClose: () => void }) => {
    const {
        currentRound,
        phase,
        rounds,
        isTestMode,
        toggleTestMode,
        advanceRound,
        resetSeason,
        initializeSeason,
        checkAndGenerateResults
    } = useSeasonStore();

    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        // Initialize season if not started
        if (rounds.length === 0) {
            initializeSeason();
        }
    }, []);

    const handleAdvanceRound = () => {
        const currentRoundData = rounds.find(r => r.number === currentRound);

        // Simulate all games in current round if not complete
        if (currentRoundData && !currentRoundData.isComplete) {
            currentRoundData.games.forEach(game => {
                if (!game.isComplete) {
                    useSeasonStore.getState().simulateGame(game.id);
                }
            });
        }

        // Advance to next round
        advanceRound();
    };

    const handleSimulateToPlayoffs = async () => {
        setIsSimulating(true);

        for (let i = currentRound; i <= 14; i++) {
            const roundData = rounds.find(r => r.number === i);
            if (roundData) {
                roundData.games.forEach(game => {
                    if (!game.isComplete) {
                        useSeasonStore.getState().simulateGame(game.id);
                    }
                });
            }
            advanceRound();
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsSimulating(false);
    };

    const handleReset = () => {
        if (confirm('Tem certeza que deseja resetar a temporada? Todos os dados serão perdidos.')) {
            resetSeason();
            initializeSeason();
        }
    };

    const isGameTime = scheduleManager.isLiveTime();
    const nextGame = scheduleManager.getNextGameDay();

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6 space-y-6 border-primary">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Painel Admin</h2>
                        <p className="text-sm text-muted-foreground">Modo de teste e controles</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Rodada Atual</div>
                        <div className="text-2xl font-bold text-foreground">{currentRound}/17</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Fase</div>
                        <div className="text-2xl font-bold text-primary">
                            {phase === 'regular' ? 'Regular' :
                                phase === 'quarterfinals' ? 'Quartas' :
                                    phase === 'semifinals' ? 'Semis' :
                                        phase === 'finals' ? 'Final' : 'Encerrado'}
                        </div>
                    </div>
                </div>

                {/* Game Time Info */}
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-muted-foreground">Status do Jogo</div>
                            <div className="text-lg font-bold text-foreground">
                                {isGameTime ? '🔴 AO VIVO' : '⚫ OFFLINE'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Próximo Jogo</div>
                            <div className="text-lg font-bold text-foreground">
                                {nextGame.toLocaleDateString('pt-BR', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test Mode Toggle */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                        <div className="font-semibold text-foreground">Modo Teste</div>
                        <div className="text-sm text-muted-foreground">
                            Permite avançar rodadas manualmente
                        </div>
                    </div>
                    <Button
                        variant={isTestMode ? "default" : "outline"}
                        onClick={toggleTestMode}
                    >
                        {isTestMode ? 'Ativado' : 'Desativado'}
                    </Button>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        className="w-full gap-2"
                        onClick={handleAdvanceRound}
                        disabled={phase === 'completed' || isSimulating}
                    >
                        <Play className="w-4 h-4" />
                        Avançar Rodada
                    </Button>

                    <Button
                        className="w-full gap-2"
                        variant="secondary"
                        onClick={handleSimulateToPlayoffs}
                        disabled={phase !== 'regular' || currentRound > 14 || isSimulating}
                    >
                        <FastForward className="w-4 h-4" />
                        {isSimulating ? 'Simulando...' : 'Simular até Playoffs'}
                    </Button>

                    <Button
                        className="w-full gap-2"
                        variant="outline"
                        onClick={checkAndGenerateResults}
                    >
                        <Play className="w-4 h-4" />
                        Forçar Geração de Resultados
                    </Button>

                    <Button
                        className="w-full gap-2 text-destructive hover:text-destructive"
                        variant="outline"
                        onClick={handleReset}
                    >
                        <RotateCcw className="w-4 h-4" />
                        Resetar Temporada
                    </Button>
                </div>

                {/* Instructions */}
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <p className="font-semibold mb-2">Atalhos:</p>
                    <ul className="space-y-1">
                        <li>• <kbd className="px-2 py-1 bg-background rounded">Ctrl+Shift+T</kbd> - Abrir/Fechar painel</li>
                        <li>• <kbd className="px-2 py-1 bg-background rounded">Esc</kbd> - Fechar painel</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};
