import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NewsCard } from '@/components/NewsCard';
import { useNewsStore } from '@/hooks/useNewsStore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Newspaper } from 'lucide-react';
import logo from '@/assets/los-santos-logo.png';

const News = () => {
    const { getAllNews } = useNewsStore();
    const allNews = getAllNews();

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={logo}
                                alt="City of Los Santos Logo"
                                className="w-16 h-16 md:w-20 md:h-20"
                            />
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                                    Últimas Notícias
                                </h1>
                                <p className="text-lg text-primary font-semibold">Adult Basketball League</p>
                            </div>
                        </div>

                        <Link to="/">
                            <Button variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {allNews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Newspaper className="w-20 h-20 text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            Nenhuma notícia ainda
                        </h2>
                        <p className="text-muted-foreground max-w-md">
                            As notícias serão geradas automaticamente conforme as rodadas forem sendo concluídas.
                            Aguarde os próximos jogos!
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Hero/Featured News */}
                        {allNews[0] && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-primary rounded-full" />
                                    Destaque
                                </h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <NewsCard news={allNews[0]} />
                                    {allNews[1] && <NewsCard news={allNews[1]} />}
                                </div>
                            </div>
                        )}

                        {/* All News Grid */}
                        {allNews.length > 2 && (
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <span className="w-1 h-8 bg-primary rounded-full" />
                                    Todas as Notícias
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allNews.slice(2).map((news) => (
                                        <NewsCard key={news.id} news={news} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default News;
