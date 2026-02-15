interface HeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  assignedCount: number;
  totalMembers: number;
}

export default function Header({
  soundEnabled,
  onToggleSound,
  assignedCount,
  totalMembers,
}: HeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-gold-dim/30 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-bold text-gold truncate">Níveis de Pensamento</h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onToggleSound}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-secondary text-lg"
            aria-label={soundEnabled ? 'Desativar som' : 'Ativar som'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 bg-bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-300"
            style={{ width: `${(assignedCount / totalMembers) * 100}%` }}
          />
        </div>
        <span className="text-xs text-text-muted flex-shrink-0">{assignedCount}/{totalMembers}</span>
      </div>
    </div>
  );
}
