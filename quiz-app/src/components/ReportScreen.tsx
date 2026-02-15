import { useState, useEffect } from 'react';
import ReportModal from './ReportModal';
import type { LeaderboardEntry } from '../hooks/useQuizState';
import { launchConfetti } from '../utils/confetti';

interface ReportScreenProps {
  currentScore: number;
  totalMembers: number;
  scorePercentage: number;
  playerName: string;
  leaderboard: LeaderboardEntry[];
  onRestart: () => void;
}

export default function ReportScreen({
  currentScore,
  totalMembers,
  scorePercentage,
  playerName,
  leaderboard,
  onRestart,
}: ReportScreenProps) {
  const [showReport, setShowReport] = useState(false);
  const isPerfect = scorePercentage === 100;
  const canViewReport = scorePercentage >= 90;

  useEffect(() => {
    if (isPerfect) {
      launchConfetti();
    }
  }, [isPerfect]);

  // Find this player's ranking position (most recent entry for this name)
  const rankIndex = leaderboard.findIndex(
    (e) => e.name === playerName && e.score === scorePercentage
  );
  const rankPosition = rankIndex >= 0 ? rankIndex + 1 : leaderboard.length;

  const handleShare = async () => {
    const text = `Consegui ${scorePercentage}% no Quiz Níveis de Pensamento! Posição #${rankPosition} no ranking 🎯 Tenta tu: ${window.location.href}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Quiz Níveis de Pensamento', text });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Texto copiado para a área de transferência!');
      }
    } catch {
      // User cancelled share or clipboard failed
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center px-6 py-8 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
        <h1 className="text-xl font-bold text-gold mb-1">
          {isPerfect ? 'Parabéns!' : 'Resultado Final'}
        </h1>

        {isPerfect && (
          <p className="text-sm text-gold-light/80 mb-6">Acertaste todos os nomes!</p>
        )}

        {/* Big percentage */}
        <div className="relative my-6">
          <div className="w-36 h-36 rounded-full border-4 border-gold/30 flex items-center justify-center bg-bg-secondary/50">
            <div>
              <span className="text-4xl font-bold text-gold">{scorePercentage}</span>
              <span className="text-xl text-gold/70">%</span>
            </div>
          </div>
          {isPerfect && (
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">⭐</div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-text">{currentScore}/{totalMembers}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Corretos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">#{rankPosition}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Posição</p>
          </div>
        </div>

      </div>

      {/* Leaderboard + Action buttons */}
      <div className="w-full flex flex-col gap-3 pb-4">
        {/* Ranking */}
        {leaderboard.length > 0 && (
          <div className="bg-bg-secondary/80 backdrop-blur rounded-xl p-4 border border-gold-dim/20 w-full">
            <h2 className="text-xs font-bold text-gold uppercase tracking-wider mb-3">
              Ranking
            </h2>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {leaderboard.slice(0, 20).map((entry, i) => {
                const isCurrentRun = i === rankIndex;
                return (
                  <div
                    key={`${entry.name}-${entry.date}`}
                    className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
                      isCurrentRun
                        ? 'bg-gold/20 ring-1 ring-gold/40'
                        : i === 0 ? 'bg-gold/15' : i < 3 ? 'bg-gold/5' : ''
                    }`}
                  >
                    <span className={`w-5 font-bold ${i < 3 ? 'text-gold' : 'text-text-muted'}`}>
                      {i + 1}.
                    </span>
                    <span className="flex-1 text-left text-text truncate">{entry.name}</span>
                    <span className="font-bold text-gold">{entry.score}%</span>
                    <span className="text-text-muted text-[9px]">{entry.correct}/{entry.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3.5 rounded-xl bg-bg-secondary border border-gold/30 text-gold font-bold text-sm hover:bg-bg-tertiary active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>📤</span> Partilhar
          </button>
          <button
            onClick={() => canViewReport && setShowReport(true)}
            disabled={!canViewReport}
            className={`flex-1 py-3.5 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              canViewReport
                ? 'bg-bg-secondary border-gold/30 text-gold hover:bg-bg-tertiary active:scale-[0.98]'
                : 'bg-bg-secondary/50 border-gold/10 text-text-muted/40 cursor-not-allowed'
            }`}
            title={!canViewReport ? 'Precisas de pelo menos 90% para ver a análise' : undefined}
          >
            <span>📋</span> Análise {!canViewReport && '🔒'}
          </button>
        </div>
        <button
          onClick={onRestart}
          className="w-full py-3.5 rounded-xl bg-gold text-bg font-bold text-sm hover:bg-gold-light active:scale-[0.98] transition-all"
        >
          Recomeçar
        </button>
      </div>

      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
    </div>
  );
}
