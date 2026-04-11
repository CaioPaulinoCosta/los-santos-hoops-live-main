import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsItem } from '@/hooks/useNewsStore';
import { teams } from '@/data/teams';
import { Calendar } from 'lucide-react';

interface NewsCardProps {
    news: NewsItem;
}

export const NewsCard = ({ news }: NewsCardProps) => {
    const relatedTeams = news.relatedTeamIds
        ?.map(id => teams.find(t => t.id === id))
        .filter(Boolean);

    const typeColors = {
        match_result: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        standings: 'bg-green-500/10 text-green-500 border-green-500/20',
        championship: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        general: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    };

    const typeLabels = {
        match_result: 'Resultado',
        standings: 'Classificação',
        championship: 'Campeonato',
        general: 'Geral'
    };

    return (
        <Card className="overflow-hidden hover:border-primary/50 transition-all duration-300 group">
            {/* Image with team logo overlay */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Team logos overlay */}
                {relatedTeams && relatedTeams.length > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                        {relatedTeams.slice(0, 2).map((team, idx) => (
                            <div key={team!.id} className="flex items-center gap-1">
                                {team!.logo ? (
                                    <img
                                        src={team!.logo}
                                        alt={team!.name}
                                        className="w-10 h-10 object-contain bg-white/90 rounded-full p-1 shadow-lg"
                                    />
                                ) : (
                                    <div
                                        className="w-10 h-10 rounded-full shadow-lg border-2 border-white"
                                        style={{ backgroundColor: team!.color }}
                                    />
                                )}
                                {idx === 0 && relatedTeams.length > 1 && (
                                    <span className="text-white font-bold text-sm mx-1">VS</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Type badge */}
                <Badge
                    variant="outline"
                    className={`absolute top-3 right-3 ${typeColors[news.type]} backdrop-blur-sm`}
                >
                    {typeLabels[news.type]}
                </Badge>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                <h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                </h3>

                <p className="text-muted-foreground text-sm line-clamp-3">
                    {news.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                            {news.date.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                        Rodada {news.round}
                    </Badge>
                </div>
            </div>
        </Card>
    );
};
