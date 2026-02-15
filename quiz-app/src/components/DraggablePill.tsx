import { useDraggable } from '@dnd-kit/core';

interface DraggablePillProps {
  id: string;
  name: string;
  isLocked?: boolean;
  isAnimatingBack?: boolean;
}

export default function DraggablePill({ id, name, isLocked, isAnimatingBack }: DraggablePillProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    disabled: isLocked,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
        select-none cursor-grab active:cursor-grabbing
        transition-opacity duration-150
        touch-none
        max-w-[160px]
        ${isLocked
          ? 'bg-green-lock/20 text-green-lock border border-green-lock/40 cursor-default animate-pulse-green'
          : 'bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25'
        }
        ${isAnimatingBack ? 'animate-fly-back' : ''}
      `}
    >
      <span className="truncate">{name}</span>
    </div>
  );
}
