import { getAllMembers, getLevels } from '../data/quizData';

export interface VerifyResult {
  correctIds: string[];
  wrongIds: string[];
  isPerfect: boolean;
}

export function verifyAssignments(assignments: Record<string, number>, allMembers: ReturnType<typeof getAllMembers>): VerifyResult {
  const correctIds: string[] = [];
  const wrongIds: string[] = [];

  for (const member of allMembers) {
    const assignedLevel = assignments[member.id];
    if (assignedLevel === undefined) continue;

    const correctLevel = getLevels().find(l => l.members.includes(member.name));
    if (correctLevel && correctLevel.id === assignedLevel) {
      correctIds.push(member.id);
    } else {
      wrongIds.push(member.id);
    }
  }

  const isPerfect = correctIds.length === allMembers.length;

  return {
    correctIds,
    wrongIds,
    isPerfect,
  };
}
