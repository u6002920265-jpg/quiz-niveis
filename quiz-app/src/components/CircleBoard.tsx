import { useState, useCallback } from 'react';
import { getLevels, CIRCLE_CX, CIRCLE_CY, CIRCLE_R, IMG_W, IMG_H } from '../data/quizData';
import type { Member } from '../data/quizData';
import BottomSheet from './BottomSheet';

interface CircleBoardProps {
  assignments: Record<string, number>;
  lockedNames: string[];
  allMembers: Member[];
  onUnassign: (memberId: string) => void;
  isVerifying: boolean;
  activeDropZone: number | null;
}

/** Build an SVG path `d` for a pie-slice sector. Optional custom radius. */
function sectorPath(startDeg: number, endDeg: number, radius?: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  let span = ((endDeg - startDeg) + 360) % 360;
  if (span === 0) span = 360;

  const cx = CIRCLE_CX;
  const cy = CIRCLE_CY;
  const r = radius ?? CIRCLE_R;

  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));

  const largeArc = span > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
}


export default function CircleBoard({
  assignments,
  lockedNames,
  allMembers,
  onUnassign,
  isVerifying,
  activeDropZone,
}: CircleBoardProps) {
  const [openSheet, setOpenSheet] = useState<number | null>(null);
  const levels = getLevels();

  const getMembersForLevel = useCallback(
    (levelId: number) => allMembers.filter((m) => assignments[m.id] === levelId),
    [allMembers, assignments]
  );

  const getCountForLevel = useCallback(
    (levelId: number) => Object.values(assignments).filter((lid) => lid === levelId).length,
    [assignments]
  );

  return (
    <>
      <div className="relative w-full" style={{ aspectRatio: `${IMG_W}/${IMG_H}` }}>
        {/* Background image */}
        <img
          src="/nivel.png"
          alt="Níveis de Pensamento"
          className="w-full h-full object-contain"
          draggable={false}
        />

        {/* SVG sectors at 15% opacity matching the circle in the image */}
        <svg
          viewBox={`0 0 ${IMG_W} ${IMG_H}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {levels.map((level) => {
            const isActive = activeDropZone === level.id;
            const count = getCountForLevel(level.id);
            const isFull = count >= level.capacity;
            return (
              <path
                key={level.id}
                d={sectorPath(level.angleStart, level.angleEnd)}
                fill={level.overlayColor}
                fillOpacity={0.15}
                stroke={isActive && !isFull ? '#d4a34a' : 'none'}
                strokeWidth={isActive && !isFull ? 4 : 0}
                style={{
                  filter: isActive && !isFull ? 'drop-shadow(0 0 12px rgba(212,163,74,0.7))' : undefined,
                  transition: 'filter 0.2s ease, stroke 0.2s ease',
                }}
              />
            );
          })}
        </svg>

        {/* HTML overlays: title labels + count badges on top of SVG sectors */}
        {levels.map((level) => {
          const count = getCountForLevel(level.id);
          const isActive = activeDropZone === level.id;
          const isFull = count >= level.capacity;

          return (
            <div key={`ui-${level.id}`}>
              {/* Count badge */}
              <button
                onClick={() => setOpenSheet(level.id)}
                className={`absolute z-20 flex items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200 ${
                  isFull
                    ? 'bg-green-lock/30 text-green-lock border border-green-lock/50'
                    : isActive
                    ? 'bg-gold/40 text-gold border border-gold/60 scale-110'
                    : 'bg-bg/70 text-gold border border-gold/30 backdrop-blur-sm'
                } ${isVerifying ? 'pointer-events-none' : ''}`}
                style={{
                  top: level.badgePosition.top,
                  left: level.badgePosition.left,
                  minWidth: '44px',
                  height: '24px',
                  padding: '0 8px',
                }}
              >
                {count}/{level.capacity}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom sheet for viewing assigned names */}
      {openSheet !== null && (
        <BottomSheet
          isOpen={true}
          onClose={() => setOpenSheet(null)}
          levelName={levels.find((l) => l.id === openSheet)?.fullName ?? ''}
          members={getMembersForLevel(openSheet)}
          lockedNames={lockedNames}
          onRemove={(memberId) => {
            onUnassign(memberId);
          }}
        />
      )}
    </>
  );
}
