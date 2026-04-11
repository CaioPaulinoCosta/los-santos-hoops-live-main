import { PlayoffBracket } from "@/lib/tournamentManager";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface BracketViewProps {
    brackets: PlayoffBracket[];
    currentPhase: string;
}

export const BracketView = ({ brackets, currentPhase }: BracketViewProps) => {
    const getRoundName = (phase: string): string => {
        switch (phase) {
            case 'round_of_16': return 'Oitavas de Final';
            case 'quarterfinals': return 'Quartas de Final';
            case 'semifinals': return 'Semifinais';
            case 'finals': return 'FINAL';
            default: return phase;
        }
    };

    // Group brackets by round
    const roundOf16 = brackets.filter(b => b.round === 'round_of_16');
    const quarterfinals = brackets.filter(b => b.round === 'quarterfinals');
    const semifinals = brackets.filter(b => b.round === 'semifinals');
    const finals = brackets.filter(b => b.round === 'finals');

    const renderMatchup = (bracket: PlayoffBracket, isActive: boolean) => {
        if (!bracket.team1 || !bracket.team2) return null;

        return (
            <Card
                key={`${bracket.round}-${bracket.matchNumber}`}
                className={`p-4 space-y-2 ${isActive && !bracket.isComplete ? 'border-primary border-2 shadow-lg' : ''
                    } ${bracket.isComplete ? 'opacity-75' : ''}`}
            >
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Jogo #{bracket.matchNumber}</span>
                    {bracket.isComplete && (
                        <Badge variant="secondary" className="text-xs">Finalizado</Badge>
                    )}
                </div>

                {/* Team 1 */}
                <div className={`flex items-center justify-between p-2 rounded ${bracket.winner?.id === bracket.team1.id ? 'bg-primary/20 font-bold' : 'bg-muted/30'
                    }`}>
                    <div className="flex items-center gap-2">
                        {bracket.team1.logo && (
                            <img src={bracket.team1.logo} alt={bracket.team1.name} className="w-6 h-6" />
                        )}
                        <span className="text-sm">{bracket.team1.shortName}</span>
                    </div>
                    <span className="text-lg font-bold">{bracket.score1 || '-'}</span>
                </div>

                {/* Team 2 */}
                <div className={`flex items-center justify-between p-2 rounded ${bracket.winner?.id === bracket.team2.id ? 'bg-primary/20 font-bold' : 'bg-muted/30'
                    }`}>
                    <div className="flex items-center gap-2">
                        {bracket.team2.logo && (
                            <img src={bracket.team2.logo} alt={bracket.team2.name} className="w-6 h-6" />
                        )}
                        <span className="text-sm">{bracket.team2.shortName}</span>
                    </div>
                    <span className="text-lg font-bold">{bracket.score2 || '-'}</span>
                </div>
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            {/* Round of 16 */}
            {roundOf16.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{getRoundName('round_of_16')}</h3>
                        {currentPhase === 'round_of_16' && (
                            <Badge variant="default" className="animate-pulse">EM ANDAMENTO</Badge>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {roundOf16.map(bracket => renderMatchup(bracket, currentPhase === 'round_of_16'))}
                    </div>
                </div>
            )}

            {/* Quarterfinals */}
            {quarterfinals.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{getRoundName('quarterfinals')}</h3>
                        {currentPhase === 'quarterfinals' && (
                            <Badge variant="default" className="animate-pulse">EM ANDAMENTO</Badge>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quarterfinals.map(bracket => renderMatchup(bracket, currentPhase === 'quarterfinals'))}
                    </div>
                </div>
            )}

            {/* Semifinals */}
            {semifinals.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-bold">{getRoundName('semifinals')}</h3>
                        {currentPhase === 'semifinals' && (
                            <Badge variant="default" className="animate-pulse">EM ANDAMENTO</Badge>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {semifinals.map(bracket => renderMatchup(bracket, currentPhase === 'semifinals'))}
                    </div>
                </div>
            )}

            {/* Finals */}
            {finals.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <Trophy className="w-8 h-8 text-primary" />
                        <h3 className="text-3xl font-bold text-primary">{getRoundName('finals')}</h3>
                        <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div className="max-w-md mx-auto">
                        {finals.map(bracket => renderMatchup(bracket, currentPhase === 'finals'))}
                    </div>
                </div>
            )}
        </div>
    );
};
