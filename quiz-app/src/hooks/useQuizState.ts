import { useReducer, useCallback, useEffect } from 'react';
import { getAllMembers, shuffleArray, getLevels, type Member } from '../data/quizData';
import { verifyAssignments, type VerifyResult } from '../utils/scoring';
import { getStoredValue, setStoredValue, removeStoredValue } from './useLocalStorage';

const QUIZ_STATE_KEY = 'quiz-niveis-state';
const PREFS_KEY = 'quiz-niveis-prefs';
const LEADERBOARD_KEY = 'quiz-niveis-leaderboard';

export interface LeaderboardEntry {
  name: string;
  score: number; // percentage
  correct: number;
  total: number;
  date: string;
}

export type Screen = 'welcome' | 'quiz' | 'report';

export interface QuizState {
  screen: Screen;
  assignments: Record<string, number>; // memberId → levelId
  lockedNames: string[]; // memberIds confirmed correct
  shuffledMembers: Member[];
  allMembers: Member[];
  currentScore: number;
  scorePercentage: number;
  allTimeBestScore: number;
  soundEnabled: boolean;
  lastVerifyResult: VerifyResult | null;
  isVerifying: boolean;
  hasSavedState: boolean;
  playerName: string;
  leaderboard: LeaderboardEntry[];
}

type Action =
  | { type: 'START_QUIZ'; playerName: string; resume?: boolean }
  | { type: 'ASSIGN_NAME'; memberId: string; levelId: number }
  | { type: 'UNASSIGN_NAME'; memberId: string }
  | { type: 'VERIFY' }
  | { type: 'VERIFY_COMPLETE' }
  | { type: 'SHOW_REPORT' }
  | { type: 'RESTART' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'SET_SCREEN'; screen: Screen };

function getInitialState(): QuizState {
  const allMembers = getAllMembers();
  const prefs = getStoredValue(PREFS_KEY, { allTimeBestScore: 0, soundEnabled: true, playerName: '' });
  const leaderboard = getStoredValue<LeaderboardEntry[]>(LEADERBOARD_KEY, []);
  const savedState = getStoredValue<{
    assignments: Record<string, number>;
    shuffledOrder: string[];
    playerName: string;
  } | null>(QUIZ_STATE_KEY, null);

  const hasSavedState = savedState !== null;

  return {
    screen: 'welcome',
    assignments: {},
    lockedNames: [],
    shuffledMembers: shuffleArray(allMembers),
    allMembers,
    currentScore: 0,
    scorePercentage: 0,
    allTimeBestScore: prefs.allTimeBestScore,
    soundEnabled: prefs.soundEnabled,
    lastVerifyResult: null,
    isVerifying: false,
    hasSavedState,
    playerName: prefs.playerName || '',
    leaderboard,
  };
}

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case 'START_QUIZ': {
      if (action.resume) {
        const saved = getStoredValue<{
          assignments: Record<string, number>;
          shuffledOrder: string[];
          playerName: string;
        } | null>(QUIZ_STATE_KEY, null);

        if (saved) {
          const orderedMembers = saved.shuffledOrder
            .map(id => state.allMembers.find(m => m.id === id))
            .filter((m): m is Member => m !== undefined);

          return {
            ...state,
            screen: 'quiz',
            assignments: saved.assignments,
            shuffledMembers: orderedMembers,
            playerName: saved.playerName || action.playerName,
          };
        }
      }
      const shuffled = shuffleArray(state.allMembers);
      return {
        ...state,
        screen: 'quiz',
        assignments: {},
        lockedNames: [],
        shuffledMembers: shuffled,
        currentScore: 0,
        scorePercentage: 0,
        lastVerifyResult: null,
        isVerifying: false,
        playerName: action.playerName,
      };
    }

    case 'ASSIGN_NAME': {
      if (state.lockedNames.includes(action.memberId)) return state;
      const levels = getLevels();
      const targetLevel = levels.find(l => l.id === action.levelId);
      if (!targetLevel) return state;

      // Check capacity
      const currentCount = Object.values(state.assignments)
        .filter(lid => lid === action.levelId).length;
      if (currentCount >= targetLevel.capacity) return state;

      const newAssignments = { ...state.assignments, [action.memberId]: action.levelId };

      // Auto-fill: if only one level has remaining capacity, place all unassigned names there
      const unassignedIds = state.allMembers
        .map(m => m.id)
        .filter(id => newAssignments[id] === undefined);

      if (unassignedIds.length > 0) {
        const levelsWithSpace = levels.filter(l => {
          const count = Object.values(newAssignments).filter(lid => lid === l.id).length;
          return count < l.capacity;
        });

        if (levelsWithSpace.length === 1) {
          const lastLevel = levelsWithSpace[0];
          for (const id of unassignedIds) {
            newAssignments[id] = lastLevel.id;
          }
        }
      }

      return {
        ...state,
        assignments: newAssignments,
      };
    }

    case 'UNASSIGN_NAME': {
      if (state.lockedNames.includes(action.memberId)) return state;
      const newAssignments = { ...state.assignments };
      delete newAssignments[action.memberId];
      return {
        ...state,
        assignments: newAssignments,
      };
    }

    case 'VERIFY': {
      const result = verifyAssignments(state.assignments, state.allMembers);
      return {
        ...state,
        isVerifying: true,
        lastVerifyResult: result,
      };
    }

    case 'VERIFY_COMPLETE': {
      const result = state.lastVerifyResult;
      if (!result) return state;

      const correctCount = result.correctIds.length;
      const percentage = Math.round((correctCount / state.allMembers.length) * 100);
      const newAllTimeBest = Math.max(state.allTimeBestScore, percentage);

      // Save to leaderboard
      const entry: LeaderboardEntry = {
        name: state.playerName || 'Anónimo',
        score: percentage,
        correct: correctCount,
        total: state.allMembers.length,
        date: new Date().toISOString(),
      };
      const newLeaderboard = [...state.leaderboard, entry]
        .sort((a, b) => b.score - a.score || new Date(a.date).getTime() - new Date(b.date).getTime());

      return {
        ...state,
        lockedNames: result.correctIds,
        currentScore: correctCount,
        scorePercentage: percentage,
        allTimeBestScore: newAllTimeBest,
        isVerifying: false,
        screen: 'report',
        leaderboard: newLeaderboard,
      };
    }

    case 'SHOW_REPORT':
      return { ...state, screen: 'report' };

    case 'RESTART': {
      removeStoredValue(QUIZ_STATE_KEY);
      const shuffled = shuffleArray(state.allMembers);
      return {
        ...state,
        screen: 'welcome',
        assignments: {},
        lockedNames: [],
        shuffledMembers: shuffled,
        currentScore: 0,
        scorePercentage: 0,
        lastVerifyResult: null,
        isVerifying: false,
        hasSavedState: false,
      };
    }

    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };

    case 'SET_SCREEN':
      return { ...state, screen: action.screen };

    default:
      return state;
  }
}

export function useQuizState() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState);

  // Persist quiz state
  useEffect(() => {
    if (state.screen === 'quiz') {
      setStoredValue(QUIZ_STATE_KEY, {
        assignments: state.assignments,
        shuffledOrder: state.shuffledMembers.map(m => m.id),
        playerName: state.playerName,
      });
    }
  }, [state.assignments, state.screen, state.shuffledMembers, state.playerName]);

  // Persist prefs + leaderboard
  useEffect(() => {
    setStoredValue(PREFS_KEY, {
      allTimeBestScore: state.allTimeBestScore,
      soundEnabled: state.soundEnabled,
      playerName: state.playerName,
    });
  }, [state.allTimeBestScore, state.soundEnabled, state.playerName]);

  useEffect(() => {
    setStoredValue(LEADERBOARD_KEY, state.leaderboard);
  }, [state.leaderboard]);

  const assignName = useCallback((memberId: string, levelId: number) => {
    dispatch({ type: 'ASSIGN_NAME', memberId, levelId });
  }, []);

  const unassignName = useCallback((memberId: string) => {
    dispatch({ type: 'UNASSIGN_NAME', memberId });
  }, []);

  const startQuiz = useCallback((playerName: string, resume = false) => {
    dispatch({ type: 'START_QUIZ', playerName, resume });
  }, []);

  const verify = useCallback(() => {
    dispatch({ type: 'VERIFY' });
  }, []);

  const verifyComplete = useCallback(() => {
    dispatch({ type: 'VERIFY_COMPLETE' });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOUND' });
  }, []);

  // Count how many names are assigned (not locked)
  const assignedCount = Object.keys(state.assignments).length;
  const totalMembers = state.allMembers.length;
  const canVerify = assignedCount === totalMembers && !state.isVerifying;

  // Names still in the pool (not assigned anywhere)
  const poolMembers = state.shuffledMembers.filter(
    m => state.assignments[m.id] === undefined
  );

  // Names assigned to a specific level
  const getMembersForLevel = (levelId: number) => {
    return state.allMembers.filter(m => state.assignments[m.id] === levelId);
  };

  const getAssignedCountForLevel = (levelId: number) => {
    return Object.values(state.assignments).filter(lid => lid === levelId).length;
  };

  const isNameLocked = (memberId: string) => state.lockedNames.includes(memberId);

  return {
    state,
    assignName,
    unassignName,
    startQuiz,
    verify,
    verifyComplete,
    restart,
    toggleSound,
    canVerify,
    poolMembers,
    getMembersForLevel,
    getAssignedCountForLevel,
    isNameLocked,
    assignedCount,
    totalMembers,
  };
}
