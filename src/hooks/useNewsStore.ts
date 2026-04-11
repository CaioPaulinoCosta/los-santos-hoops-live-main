import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Team } from '@/data/teams';

export type NewsType = 'match_result' | 'standings' | 'championship' | 'general';

export interface NewsItem {
    id: string;
    title: string;
    content: string;
    image: string; // Path to background asset
    relatedTeamIds?: string[]; // IDs of teams involved to overlay logos
    date: Date;
    round: number;
    type: NewsType;
}

interface NewsState {
    news: NewsItem[];
}

interface NewsStore extends NewsState {
    addNews: (item: Omit<NewsItem, 'id' | 'date'>) => void;
    getNewsByRound: (round: number) => NewsItem[];
    getAllNews: () => NewsItem[];
    clearNews: () => void;
}

export const useNewsStore = create<NewsStore>()(
    persist(
        (set, get) => ({
            news: [],

            addNews: (item) => {
                const newItem: NewsItem = {
                    ...item,
                    id: `news-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    date: new Date()
                };

                set((state) => ({
                    news: [newItem, ...state.news] // Newest first
                }));
            },

            getNewsByRound: (round) => {
                return get().news.filter(item => item.round === round);
            },

            getAllNews: () => {
                return get().news;
            },

            clearNews: () => {
                set({ news: [] });
            },

            reset: () => {
                localStorage.removeItem('news-storage');
                set({ news: [] });
            }
        }),
        {
            name: 'news-storage',
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name);
                    if (!str) return null;
                    const { state } = JSON.parse(str);
                    
                    // FILTRO DE SEGURANÇA: Remove notícias "fantasmas" de testes antigos
                    const filteredNews = (state.news || []).filter((item: any) => 
                        !item.title.toLowerCase().includes('mirror park') && 
                        !item.content.toLowerCase().includes('mirror park')
                    ).map((item: any) => ({
                        ...item,
                        date: new Date(item.date)
                    }));

                    return {
                        state: {
                            ...state,
                            news: filteredNews
                        }
                    };
                },
                setItem: (name, value) => {
                    const { state } = value;
                    localStorage.setItem(
                        name,
                        JSON.stringify({
                            state: {
                                ...state,
                                news: state.news?.map((item: NewsItem) => ({
                                    ...item,
                                    date: item.date.toISOString()
                                }))
                            }
                        })
                    );
                },
                removeItem: (name) => localStorage.removeItem(name)
            }
        }
    )
);
