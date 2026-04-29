import { Card } from "@/components/ui/card";
import { Clock, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { scheduleManager } from "@/lib/scheduleManager";
import { useSeasonStore } from "@/hooks/useSeasonStore";

export const NextGameCountdown = () => {
    const { seasonStartDate } = useSeasonStore();
    const [timeUntil, setTimeUntil] = useState(scheduleManager.getTimeUntilNextGame(new Date(), seasonStartDate));

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeUntil(scheduleManager.getTimeUntilNextGame(new Date(), seasonStartDate));
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, [seasonStartDate]);

    const nextGame = scheduleManager.getNextGameDay(new Date(), seasonStartDate);
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return (
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-background border-primary/20">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                    <Calendar className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-1">Próxima Rodada</h3>
                    <p className="text-sm text-muted-foreground">
                        {dayNames[nextGame.getDay()]}, {nextGame.getDate()} de {monthNames[nextGame.getMonth()]} às {nextGame.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-primary">
                        <Clock className="w-5 h-5" />
                        <div className="font-mono text-2xl font-bold">
                            {timeUntil.days > 0 && `${timeUntil.days}d `}
                            {timeUntil.hours}h {timeUntil.minutes}m {timeUntil.seconds}s
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">até o próximo jogo</p>
                </div>
            </div>
        </Card>
    );
};
