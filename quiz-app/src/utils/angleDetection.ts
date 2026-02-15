import { getLevels } from '../data/quizData';

export interface CircleConfig {
  centerX: number;
  centerY: number;
  radius: number;
}

/**
 * Determines which level slice a point falls into based on angular position
 * relative to the circle center. Returns the level ID or null if outside the circle.
 */
export function getSliceForPoint(
  x: number,
  y: number,
  circle: CircleConfig
): number | null {
  const dx = x - circle.centerX;
  const dy = y - circle.centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Outside the circle — reject
  if (distance > circle.radius * 1.15) return null;

  // Calculate angle in degrees (0° = right, clockwise)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  angle = (angle + 360) % 360;

  const levels = getLevels();

  for (const level of levels) {
    const { angleStart, angleEnd } = level;
    if (angleStart < angleEnd) {
      // Normal range (e.g., 140 to 220)
      if (angle >= angleStart && angle < angleEnd) return level.id;
    } else {
      // Wraps around 360 (e.g., 340 to 40)
      if (angle >= angleStart || angle < angleEnd) return level.id;
    }
  }

  // Fallback: find nearest slice center
  let nearestId = 1;
  let nearestDist = Infinity;
  for (const level of levels) {
    const mid = level.angleStart < level.angleEnd
      ? (level.angleStart + level.angleEnd) / 2
      : ((level.angleStart + level.angleEnd + 360) / 2) % 360;
    let diff = Math.abs(angle - mid);
    if (diff > 180) diff = 360 - diff;
    if (diff < nearestDist) {
      nearestDist = diff;
      nearestId = level.id;
    }
  }
  return nearestId;
}
