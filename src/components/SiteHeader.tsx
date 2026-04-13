import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Newspaper, Trophy } from "lucide-react";
import logo from "@/assets/los-santos-logo.png";

interface SiteHeaderProps {
  /** Exibe o relógio no canto direito */
  currentTime?: string;
  /** Exibe o badge AO VIVO / OFFLINE */
  isLive?: boolean;
  /** Quando isLive=true, indica se todos os jogos já acabaram (mostra OFFLINE) */
  allGamesFinished?: boolean;
  /** Exibe o botão "← Voltar" (para páginas internas) */
  showBackButton?: boolean;
}

export const SiteHeader = ({
  currentTime,
  isLive = false,
  allGamesFinished = false,
  showBackButton = false,
}: SiteHeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + título */}
          <Link
            to="/"
            className="flex items-center gap-4 text-center md:text-left hover:opacity-80 transition-opacity"
          >
            <img
              src={logo}
              alt="City of Los Santos Logo"
              className="w-16 h-16 md:w-20 md:h-20"
            />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                City of Los Santos
              </h1>
              <p className="text-lg text-primary font-semibold">
                Adult Basketball League
              </p>
            </div>
          </Link>

          {/* Navegação direita */}
          <div className="flex items-center gap-4">
            <Link to="/news">
              <Button variant="outline" size="sm" className="gap-2">
                <Newspaper className="w-4 h-4" />
                Notícias
              </Button>
            </Link>
            <Link to="/standings">
              <Button variant="outline" size="sm" className="gap-2">
                <Trophy className="w-4 h-4" />
                Classificação
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                Histórico
              </Button>
            </Link>

            {/* Badge AO VIVO / OFFLINE — só no Home quando isLive=true */}
            {isLive && (
              allGamesFinished ? (
                <Badge variant="secondary" className="bg-muted text-muted-foreground px-4 py-2 text-sm">
                  OFFLINE
                </Badge>
              ) : (
                <Badge variant="default" className="bg-accent text-accent-foreground glow-accent px-4 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent-foreground rounded-full animate-pulse" />
                    AO VIVO
                  </span>
                </Badge>
              )
            )}

            {/* Relógio — só no Home */}
            {currentTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="tabular-nums">{currentTime}</span>
              </div>
            )}

            {/* Botão Voltar — só nas páginas internas */}
            {showBackButton && (
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
