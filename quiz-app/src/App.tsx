import { useEffect } from 'react';
import { useQuizState } from './hooks/useQuizState';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ReportScreen from './components/ReportScreen';
import LandscapeBlocker from './components/LandscapeBlocker';

function App() {
  const {
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
    assignedCount,
    totalMembers,
    refreshLeaderboard,
    retrySubmission,
  } = useQuizState();

  // Fetch global leaderboard on mount
  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  return (
    <>
      <LandscapeBlocker />

      {state.screen === 'welcome' && (
        <WelcomeScreen
          onStart={startQuiz}
          allTimeBestScore={state.allTimeBestScore}
          hasSavedState={state.hasSavedState}
          leaderboard={state.leaderboard}
          savedPlayerName={state.playerName}
        />
      )}

      {state.screen === 'quiz' && (
        <QuizScreen
          assignments={state.assignments}
          lockedNames={state.lockedNames}
          soundEnabled={state.soundEnabled}
          isVerifying={state.isVerifying}
          allMembers={state.allMembers}
          poolMembers={poolMembers}
          canVerify={canVerify}
          assignedCount={assignedCount}
          totalMembers={totalMembers}
          onAssign={assignName}
          onUnassign={unassignName}
          onVerify={verify}
          onVerifyComplete={verifyComplete}
          onToggleSound={toggleSound}
          lastVerifyResult={state.lastVerifyResult}
        />
      )}

      {state.screen === 'report' && (
        <ReportScreen
          currentScore={state.currentScore}
          totalMembers={totalMembers}
          scorePercentage={state.scorePercentage}
          playerName={state.playerName}
          leaderboard={state.leaderboard}
          submissionStatus={state.submissionStatus}
          onRestart={restart}
          onRetrySubmission={retrySubmission}
        />
      )}
    </>
  );
}

export default App
