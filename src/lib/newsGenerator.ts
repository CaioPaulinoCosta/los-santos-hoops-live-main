import { Round } from '@/hooks/useSeasonStore';
import { useNewsStore, NewsType } from '@/hooks/useNewsStore';
import newsActionImg from '@/assets/news/news-action.png';
import newsCourtImg from '@/assets/news/news-court.png';
import newsTrophyImg from '@/assets/news/news-trophy.png';
import { seededRandom } from '@/lib/utils';

interface StandingsEntry {
    teamId: string;
    wins: number;
    losses: number;
}

const newsImages = [newsActionImg, newsCourtImg];

export const newsGenerator = {
    generateNewsForRound: (roundData: Round, standings?: StandingsEntry[]) => {
        const { addNews } = useNewsStore.getState();
        const { number: roundNumber, games } = roundData;

        console.log('🗞️ Generating news for round', roundNumber);
        console.log('📊 Games in round:', games.length);
        console.log('✅ Completed games:', games.filter(g => g.isComplete).length);

        // Generate news for each completed game
        games.forEach((game) => {
            if (!game.isComplete) {
                console.log('⏭️ Skipping incomplete game:', game.id);
                return;
            }

            const scoreDiff = Math.abs(game.homeScore - game.awayScore);
            const winner = game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
            const loser = game.homeScore > game.awayScore ? game.awayTeam : game.homeTeam;
            const winnerScore = Math.max(game.homeScore, game.awayScore);
            const loserScore = Math.min(game.homeScore, game.awayScore);

            let title = '';
            let content = '';
            let type: NewsType = 'match_result';

            // Match Templates
            const closeGameTemplates = [
                { title: `${winner.name} vence ${loser.name} em jogo emocionante`, content: `Em uma partida disputada ponto a ponto, o ${winner.name} conseguiu superar o ${loser.name} por ${winnerScore} a ${loserScore}. O jogo foi decidido nos últimos minutos com grande emoção para a torcida presente no ginásio.` },
                { title: `Vitória suada! ${winner.name} bate ${loser.name} no detalhe`, content: `Foi por pouco! O ${winner.name} suou a camisa para garantir a vitória apertada de ${winnerScore} a ${loserScore} sobre o valente time do ${loser.name}. A defesa apareceu na hora certa.` },
                { title: `${winner.name} sobrevive a susto e vence ${loser.name}`, content: `O ${loser.name} valorizou muito a derrota, lutando até o fim, mas o ${winner.name} teve o controle emocional para fechar o jogo em ${winnerScore} a ${loserScore}.` }
            ];

            const moderateWinTemplates = [
                { title: `${winner.name} supera ${loser.name} em boa atuação`, content: `O ${winner.name} mostrou consistência e venceu o ${loser.name} por ${winnerScore} a ${loserScore}. A equipe manteve o controle durante a maior parte do jogo e garantiu mais uma vitória importante na temporada.` },
                { title: `Sem sustos, ${winner.name} derrota o ${loser.name}`, content: `Com uma liderança construída ainda no primeiro tempo, o ${winner.name} administrou o ritmo e construiu o placar de ${winnerScore} a ${loserScore} sem dar muitas chances ao ${loser.name}.` },
                { title: `${winner.name} impõe seu ritmo contra o ${loser.name}`, content: `Um basquete envolvente garantiu ao ${winner.name} uma vitória tranquila por ${winnerScore} a ${loserScore} em cima do ${loser.name}. O coletivo funcionou bem.` }
            ];

            const blowoutTemplates = [
                { title: `${winner.name} domina e atropela ${loser.name}`, content: `Atuação dominante do ${winner.name}, que não deu chances ao ${loser.name} e venceu de forma convincente por ${winnerScore} a ${loserScore}. A diferença no placar reflete o controle total que a equipe teve durante toda a partida.` },
                { title: `Massacre total! ${winner.name} esmaga o ${loser.name}`, content: `Não houve quem segurasse o ${winner.name} hoje. Eles aplicaram uma verdadeira aula de basquete sobre o ${loser.name}, finalizando o jogo em elásticos ${winnerScore} a ${loserScore}.` },
                { title: `Passeio em quadra: ${winner.name} atropela ${loser.name}`, content: `Só deu um time em quadra. O ${winner.name} sobrou nas estatísticas e não tomou conhecimento do ${loser.name}, selando a vitória por um sonoro placar de ${winnerScore} a ${loserScore}.` }
            ];

            // Determine news angle based on score difference (Deterministic)
            const random = seededRandom(game.id);
            let template;
            if (scoreDiff <= 5) {
                template = closeGameTemplates[Math.floor(random() * closeGameTemplates.length)];
            } else if (scoreDiff <= 15) {
                template = moderateWinTemplates[Math.floor(random() * moderateWinTemplates.length)];
            } else {
                template = blowoutTemplates[Math.floor(random() * blowoutTemplates.length)];
            }
            
            title = template.title;
            content = template.content;

            // Check for upset (if standings provided)
            if (standings && standings.length > 0) {
                const winnerStanding = standings.findIndex(s => s.teamId === winner.id);
                const loserStanding = standings.findIndex(s => s.teamId === loser.id);

                // Matchups events
                
                // Zebra (Upset)
                if (winnerStanding > loserStanding && loserStanding < 4 && winnerStanding > 6) {
                    title = `Zebra! ${winner.name} surpreende e vence ${loser.name}`;
                    content = `Em uma das maiores surpresas da rodada, o ${winner.name} conseguiu derrotar o bem colocado ${loser.name} por ${winnerScore} a ${loserScore}. A vitória mostra que qualquer time pode vencer nesta liga competitiva.`;
                } 
                // Confronto de Gigantes (Top 4 Clash)
                else if (winnerStanding < 4 && loserStanding < 4) {
                    title = `Confronto de Gigantes: ${winner.name} leva a melhor sobre ${loser.name}`;
                    content = `No aguardado duelo entre equipes da parte de cima da tabela, o ${winner.name} prevaleceu sobre o ${loser.name} no placar de ${winnerScore} a ${loserScore}, mostrando força visando os playoffs.`;
                }
            }

            addNews({
                title,
                content,
                image: newsImages[Math.floor(random() * newsImages.length)],
                relatedTeamIds: [winner.id, loser.id],
                round: roundNumber,
                type
            });

            console.log('📰 Added news:', title);
        });

        // Generate a round summary news
        if (games.length > 0) {
            const roundTitle = roundNumber <= 14
                ? `Rodada ${roundNumber}`
                : roundNumber === 15
                    ? 'Quartas de Final'
                    : roundNumber === 16
                        ? 'Semifinais'
                        : 'Final';

            addNews({
                title: `${roundTitle} é concluída com grandes jogos`,
                content: `Mais uma rodada emocionante da City of Los Santos Adult Basketball League chegou ao fim. Os ${games.length} jogos da ${roundTitle} trouxeram muita emoção para os torcedores presentes nos ginásios da cidade.`,
                image: newsCourtImg,
                round: roundNumber,
                type: 'general'
            });
        }

        // Generate dynamic storyline events based on standings
        if (standings && standings.length >= 20 && roundNumber >= 3 && roundNumber <= 14) {
            newsGenerator.generateDynamicEvents(roundNumber, standings, games);
        }
    },

    generateDynamicEvents: (roundNumber: number, standings: StandingsEntry[], games: any[]) => {
        const { addNews } = useNewsStore.getState();

        // Import teams data
        import('@/data/teams').then(({ teams }) => {
            // Get worst team (last place)
            const worstTeamData = standings[standings.length - 1];
            const worstTeam = teams.find(t => t.id === worstTeamData.teamId);

            // Get best team (first place)
            const bestTeamData = standings[0];
            const bestTeam = teams.find(t => t.id === bestTeamData.teamId);

            // Event 1: Worst team struggles (every 2 rounds, if they have little to no wins)
            if (roundNumber > 3 && roundNumber % 2 === 0 && worstTeamData.wins <= 2 && worstTeam) {
                addNews({
                    title: `${worstTeam.name} liga o sinal de alerta`,
                    content: `Com ${worstTeamData.losses} derrotas e apenas ${worstTeamData.wins} vitória(s), o ${worstTeam.name} enfrenta um momento crítico. A torcida pede mudanças e o time precisa encontrar respostas em quadra rapidamente.`,
                    image: newsCourtImg,
                    relatedTeamIds: [worstTeam.id],
                    round: roundNumber,
                    type: 'standings'
                });
            }

            // Event 2: Leader dominance (every 3 rounds, if leader has 70%+ win rate)
            const leaderWinPct = bestTeamData.wins / (bestTeamData.wins + bestTeamData.losses || 1);
            if (roundNumber > 3 && roundNumber % 3 === 0 && leaderWinPct >= 0.7 && bestTeam) {
                addNews({
                    title: `Quem segura o ${bestTeam.name}? Líderes continuam implacáveis`,
                    content: `Com uma campanha sólida de ${bestTeamData.wins} vitórias, o ${bestTeam.name} se firma não apenas como líder, mas como o time a ser batido nesta temporada. A química dos jogadores está impressionante.`,
                    image: newsActionImg,
                    relatedTeamIds: [bestTeam.id],
                    round: roundNumber,
                    type: 'standings'
                });
            }

            // Event 3: Tight race for playoffs (round 10)
            if (roundNumber === 10) {
                const eighthPlace = standings[7];
                const ninthPlace = standings[8];
                const eighth = teams.find(t => t.id === eighthPlace.teamId);
                const ninth = teams.find(t => t.id === ninthPlace.teamId);

                if (eighth && ninth) {
                    addNews({
                        title: `Disputa acirrada pela última vaga nos playoffs`,
                        content: `Com ${eighth.name} em 8º lugar e ${ninth.name} logo atrás em 9º, a briga pela última vaga nos playoffs está pegando fogo. Cada jogo pode fazer a diferença nas próximas rodadas.`,
                        image: newsCourtImg,
                        relatedTeamIds: [eighth.id, ninth.id],
                        round: roundNumber,
                        type: 'standings'
                    });
                }
            }

            // Event 4: Mid-season surprise team (round 7 or 11)
            if (roundNumber === 7 || roundNumber === 11) {
                // Find a team in top 4 with less than 50% expected wins (surprise performer)
                const surpriseTeam = standings.slice(0, 4).find(s => {
                    const winPct = s.wins / (s.wins + s.losses || 1);
                    return winPct >= 0.6; // Doing well
                });

                if (surpriseTeam) {
                    const team = teams.find(t => t.id === surpriseTeam.teamId);
                    if (team) {
                        addNews({
                            title: `${team.name} consolida status de equipe revelação`,
                            content: `Muitos duvidavam, mas com ${surpriseTeam.wins} vitórias o ${team.name} prova que veio para brigar entre os grandes nesta temporada. O entrosamento do elenco tem sido o grande trunfo.`,
                            image: newsActionImg,
                            relatedTeamIds: [team.id],
                            round: roundNumber,
                            type: 'standings'
                        });
                    }
                }
            }

            // Event 5: Mid-table slump (teams 9th-10th battling around mid-season)
            if (roundNumber === 5 || roundNumber === 8 || roundNumber === 12) {
                 if (standings.length >= 10) {
                     const team9Data = standings[8];
                     const team10Data = standings[9];
                     const team9 = teams.find(t => t.id === team9Data.teamId);
                     const team10 = teams.find(t => t.id === team10Data.teamId);
                     
                     if (team9 && team10) {
                         const time9WinPct = team9Data.wins / (team9Data.wins + team9Data.losses || 1);
                         // if hovering around 40-50%
                         if (time9WinPct < 0.6 && time9WinPct > 0.3) {
                             addNews({
                                title: `O pelotão do meio: A difícil escalada rumo aos Playoffs`,
                                content: `Equipes como ${team9.name} e ${team10.name} encontram-se no 'limbo' da tabela e oscilam entre vitórias e derrotas. Uma sequência de vitórias agora é fundamental para colar na zona de classificação.`,
                                image: newsCourtImg,
                                relatedTeamIds: [team9.id, team10.id],
                                round: roundNumber,
                                type: 'standings'
                             });
                         }
                     }
                 }
            }
        });
    },

    generatePlayoffNews: (roundNumber: number, winner: any, loser: any, score: string) => {
        const { addNews } = useNewsStore.getState();

        let title = '';
        let content = '';
        let phase = '';

        if (roundNumber === 15) {
            phase = 'Quartas de Final';
            title = `${winner.name} avança para as Semifinais`;
            content = `O ${winner.name} garantiu vaga nas semifinais após vencer o ${loser.name} por ${score} nas quartas de final. A equipe mostrou garra e determinação para seguir viva na busca pelo título.`;
        } else if (roundNumber === 16) {
            phase = 'Semifinais';
            title = `${winner.name} está na Final!`;
            content = `Com uma grande atuação, o ${winner.name} derrotou o ${loser.name} por ${score} e garantiu vaga na grande final da temporada. A torcida já se prepara para o jogo decisivo.`;
        } else if (roundNumber === 17) {
            phase = 'Final';
            title = `${winner.name} é o CAMPEÃO!`;
            content = `O ${winner.name} conquistou o título da City of Los Santos Adult Basketball League após vencer o ${loser.name} por ${score} na grande final. Uma temporada histórica coroada com o troféu de campeão!`;
        }

        addNews({
            title,
            content,
            image: roundNumber === 17 ? newsTrophyImg : newsActionImg,
            relatedTeamIds: [winner.id, loser.id],
            round: roundNumber,
            type: roundNumber === 17 ? 'championship' : 'match_result'
        });
    },

    generateStandingsNews: (roundNumber: number, topTeams: any[]) => {
        const { addNews } = useNewsStore.getState();

        if (topTeams.length < 3) return;

        const leader = topTeams[0];
        const second = topTeams[1];
        const third = topTeams[2];

        addNews({
            title: `Classificação após ${roundNumber} rodadas: disputa acirrada`,
            content: `A liderança segue com ${leader.name}, mas ${second.name} e ${third.name} seguem de perto na briga pelo topo da tabela. A temporada regular promete ser decidida nos detalhes.`,
            image: newsCourtImg,
            relatedTeamIds: [leader.id, second.id, third.id],
            round: roundNumber,
            type: 'standings'
        });
    }
};
