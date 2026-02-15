import type { Member } from '../data/quizData';
import DraggablePill from './DraggablePill';

interface NamePoolProps {
  members: Member[];
  animatingBack: string[];
}

export default function NamePool({ members, animatingBack }: NamePoolProps) {
  return (
    <div className="px-3 py-4 min-h-[140px]">
      <p className="text-[10px] text-text-muted mb-2 uppercase tracking-wider">
        Arraste os nomes para os níveis
      </p>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <DraggablePill
            key={member.id}
            id={member.id}
            name={member.name}
            isAnimatingBack={animatingBack.includes(member.id)}
          />
        ))}
      </div>
      {members.length === 0 && (
        <p className="text-xs text-text-muted text-center py-6 opacity-60">
          Todos os nomes foram colocados. Clique em "Verificar"!
        </p>
      )}
    </div>
  );
}
