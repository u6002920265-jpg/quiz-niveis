import { useState } from 'react';
import type { LeaderboardEntry } from '../hooks/useQuizState';

interface WelcomeScreenProps {
  onStart: (playerName: string, resume?: boolean) => void;
  allTimeBestScore: number;
  hasSavedState: boolean;
  leaderboard: LeaderboardEntry[];
  savedPlayerName: string;
}

export default function WelcomeScreen({ onStart, allTimeBestScore, hasSavedState, leaderboard, savedPlayerName }: WelcomeScreenProps) {
  const [name, setName] = useState(savedPlayerName);

  const handleStart = (resume = false) => {
    const playerName = name.trim() || 'Anónimo';
    onStart(playerName, resume);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-10 text-center animate-fade-in">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full">
        <div className="text-5xl mb-6">🧠</div>

        <h1 className="text-2xl font-bold text-gold mb-2 leading-tight">
          Níveis de Pensamento
        </h1>
        <p className="text-sm text-gold-light/80 mb-8">
          Grupo A Nossa Turma
        </p>

        <div className="bg-bg-secondary/80 backdrop-blur rounded-xl p-5 mb-6 text-left border border-gold-dim/20">
          <h2 className="text-xs font-bold text-gold uppercase tracking-wider mb-3">
            Como jogar
          </h2>
          <ul className="space-y-2 text-xs text-text-muted leading-relaxed">
            <li className="flex gap-2">
              <span className="text-gold">1.</span>
              <span>Arraste os nomes dos membros para o nível correto do círculo.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold">2.</span>
              <span>Quando todos os 21 nomes estiverem colocados, clique em <strong className="text-text">"Verificar"</strong>.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold">3.</span>
              <span>Tens <strong className="text-text">1 tentativa</strong> — a tua pontuação é calculada em %.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold">4.</span>
              <span>A análise detalhada só é desbloqueada com <strong className="text-text">90% ou mais</strong>.</span>
            </li>
          </ul>
        </div>

        {/* Player name input */}
        <div className="mb-6 w-full">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="O teu nome..."
            className="w-full py-3 px-4 rounded-xl bg-bg-secondary border border-gold-dim/30 text-text text-sm text-center placeholder:text-text-muted/50 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {allTimeBestScore > 0 && (
          <div className="mb-6 bg-gold/10 border border-gold/20 rounded-full px-4 py-2 inline-flex items-center gap-2">
            <span className="text-xs text-text-muted">Melhor pontuação:</span>
            <span className="text-sm font-bold text-gold">{allTimeBestScore}%</span>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full mb-8">
          {hasSavedState && (
            <button
              onClick={() => handleStart(true)}
              className="w-full py-3.5 rounded-xl bg-bg-secondary border border-gold/30 text-gold font-bold text-sm hover:bg-bg-tertiary active:scale-[0.98] transition-all"
            >
              Continuar
            </button>
          )}
          <button
            onClick={() => handleStart(false)}
            className="w-full py-3.5 rounded-xl bg-gold text-bg font-bold text-sm hover:bg-gold-light active:scale-[0.98] transition-all animate-glow"
          >
            {hasSavedState ? 'Novo Jogo' : 'Começar'}
          </button>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="bg-bg-secondary/80 backdrop-blur rounded-xl p-4 border border-gold-dim/20 w-full">
            <h2 className="text-xs font-bold text-gold uppercase tracking-wider mb-3">
              Ranking
            </h2>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {leaderboard.slice(0, 20).map((entry, i) => (
                <div
                  key={`${entry.name}-${entry.date}`}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                    i === 0 ? 'bg-gold/15' : i < 3 ? 'bg-gold/5' : ''
                  }`}
                >
                  <span className={`w-5 font-bold ${i < 3 ? 'text-gold' : 'text-text-muted'}`}>
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-left text-text truncate">{entry.name}</span>
                  <span className="font-bold text-gold">{entry.score}%</span>
                  <span className="text-text-muted text-[9px]">{entry.correct}/{entry.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
