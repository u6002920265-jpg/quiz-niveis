import type { Member } from '../data/quizData';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  levelName: string;
  members: Member[];
  lockedNames: string[];
  onRemove: (memberId: string) => void;
}

export default function BottomSheet({
  isOpen,
  onClose,
  levelName,
  members,
  lockedNames,
  onRemove,
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[390px] bg-bg-secondary rounded-t-2xl p-4 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-text-muted/40 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gold">{levelName}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-bg-tertiary text-text-muted text-xs"
          >
            ✕
          </button>
        </div>

        {members.length === 0 ? (
          <p className="text-text-muted text-xs text-center py-4">
            Nenhum nome atribuído a este nível.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const isLocked = lockedNames.includes(member.id);
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isLocked
                      ? 'bg-green-lock/20 text-green-lock border border-green-lock/40'
                      : 'bg-gold/15 text-gold border border-gold/30'
                  }`}
                >
                  {isLocked && <span className="text-[10px]">🔒</span>}
                  <span className="max-w-[140px] truncate">{member.name}</span>
                  {!isLocked && (
                    <button
                      onClick={() => onRemove(member.id)}
                      className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-wrong/20 text-red-wrong text-[9px] hover:bg-red-wrong/40"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
