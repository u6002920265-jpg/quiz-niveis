import { useState, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
} from '@dnd-kit/core';
import Header from './Header';
import CircleBoard from './CircleBoard';
import NamePool from './NamePool';
import { getSliceForPoint, type CircleConfig } from '../utils/angleDetection';
import { playDropSound, playCorrectSound, playWrongSound, playCelebrationSound, triggerHaptic } from '../utils/sound';
import type { Member } from '../data/quizData';
import { getLevels, CIRCLE_CX, CIRCLE_CY, CIRCLE_R, IMG_W, IMG_H } from '../data/quizData';

interface QuizScreenProps {
  assignments: Record<string, number>;
  lockedNames: string[];
  soundEnabled: boolean;
  isVerifying: boolean;
  allMembers: Member[];
  poolMembers: Member[];
  canVerify: boolean;
  assignedCount: number;
  totalMembers: number;
  onAssign: (memberId: string, levelId: number) => void;
  onUnassign: (memberId: string) => void;
  onVerify: () => void;
  onVerifyComplete: () => void;
  onToggleSound: () => void;
  lastVerifyResult: { correctIds: string[]; wrongIds: string[]; isPerfect: boolean } | null;
}

export default function QuizScreen({
  assignments,
  lockedNames,
  soundEnabled,
  isVerifying,
  allMembers,
  poolMembers,
  canVerify,
  assignedCount,
  totalMembers,
  onAssign,
  onUnassign,
  onVerify,
  onVerifyComplete,
  onToggleSound,
  lastVerifyResult,
}: QuizScreenProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<number | null>(null);
  const [animatingBack, setAnimatingBack] = useState<string[]>([]);
  const circleRef = useRef<HTMLDivElement>(null);

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(touchSensor, mouseSensor);

  // Get circle config from the image element position using the same
  // constants as the SVG overlay (CIRCLE_CX, CIRCLE_CY, CIRCLE_R in 575×1024 space)
  const getCircleConfig = useCallback((): CircleConfig | null => {
    const el = circleRef.current;
    if (!el) return null;
    const img = el.querySelector('img');
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const scaleX = rect.width / IMG_W;
    const scaleY = rect.height / IMG_H;
    return {
      centerX: rect.left + CIRCLE_CX * scaleX,
      centerY: rect.top + CIRCLE_CY * scaleY,
      radius: CIRCLE_R * scaleX,
    };
  }, []);

  // Extract initial pointer coordinates from activator event
  const getStartCoords = useCallback((activatorEvent: Event): { x: number; y: number } | null => {
    if ('touches' in activatorEvent) {
      const te = activatorEvent as TouchEvent;
      if (te.touches.length > 0) return { x: te.touches[0].clientX, y: te.touches[0].clientY };
    }
    if ('clientX' in activatorEvent) {
      const pe = activatorEvent as PointerEvent;
      return { x: pe.clientX, y: pe.clientY };
    }
    return null;
  }, []);

  // Track pointer position during drag to determine active drop zone
  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const circle = getCircleConfig();
      if (!circle) return;

      const start = getStartCoords(event.activatorEvent);
      if (!start) return;

      const currentX = start.x + event.delta.x;
      const currentY = start.y + event.delta.y;

      const slice = getSliceForPoint(currentX, currentY, circle);
      if (slice !== null) {
        const levels = getLevels();
        const level = levels.find(l => l.id === slice);
        const currentCount = Object.values(assignments).filter(lid => lid === slice).length;
        if (level && currentCount < level.capacity) {
          setActiveDropZone(slice);
        } else {
          setActiveDropZone(null);
        }
      } else {
        setActiveDropZone(null);
      }
    },
    [getCircleConfig, getStartCoords, assignments]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const memberId = event.active.id as string;
    setActiveDragId(null);
    setActiveDropZone(null);

    const circle = getCircleConfig();
    if (!circle) return;

    const start = getStartCoords(event.activatorEvent);
    if (!start) return;

    const dropX = start.x + event.delta.x;
    const dropY = start.y + event.delta.y;

    const slice = getSliceForPoint(dropX, dropY, circle);

    if (slice !== null) {
      const levels = getLevels();
      const level = levels.find(l => l.id === slice);
      const currentCount = Object.values(assignments).filter(lid => lid === slice).length;

      if (level && currentCount < level.capacity) {
        onAssign(memberId, slice);
        if (soundEnabled) {
          playDropSound();
          triggerHaptic(30);
        }
      }
    }
  };

  // Auto-verify when all names are assigned
  useEffect(() => {
    if (canVerify && !isVerifying) {
      const timer = setTimeout(() => onVerify(), 500);
      return () => clearTimeout(timer);
    }
  }, [canVerify, isVerifying, onVerify]);

  // Handle verify animation
  useEffect(() => {
    if (isVerifying && lastVerifyResult) {
      // Play sounds
      if (soundEnabled) {
        if (lastVerifyResult.isPerfect) {
          playCelebrationSound();
          triggerHaptic([100, 50, 100, 50, 200]);
        } else if (lastVerifyResult.correctIds.length > 0) {
          playCorrectSound();
          triggerHaptic([50, 30, 50]);
        } else {
          playWrongSound();
          triggerHaptic(200);
        }
      }

      // After animation delay, complete verification
      const timer = setTimeout(() => {
        setAnimatingBack(lastVerifyResult.wrongIds);
        onVerifyComplete();

        // Clear animation flags after animation plays
        setTimeout(() => setAnimatingBack([]), 500);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [isVerifying, lastVerifyResult, onVerifyComplete, soundEnabled]);

  const activeMember = activeDragId
    ? allMembers.find((m) => m.id === activeDragId)
    : null;

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        assignedCount={assignedCount}
        totalMembers={totalMembers}
      />

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
      >
        <div className="flex-1 flex flex-col">
          {/* Circle board */}
          <div ref={circleRef}>
            <CircleBoard
              assignments={assignments}
              lockedNames={lockedNames}
              allMembers={allMembers}
              onUnassign={onUnassign}
              isVerifying={isVerifying}
              activeDropZone={activeDropZone}
            />
          </div>

          {/* Name pool */}
          <NamePool members={poolMembers} animatingBack={animatingBack} />
        </div>

        {/* Drag overlay — pill follows finger */}
        <DragOverlay dropAnimation={null}>
          {activeMember ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gold/30 text-gold border border-gold/50 shadow-lg shadow-gold/20 scale-85 opacity-90">
              <span className="truncate max-w-[140px]">{activeMember.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
