'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { trackTrainingEvent } from '@/lib/training/analytics';
import type {
  AttemptCompleteResult,
  TrainingLevelDetailResponse,
} from '@/lib/training/types';
import TrainingReader from '@/components/training/TrainingReader';
import QuizFlow from '@/components/training/QuizFlow';
import TrainingResults from '@/components/training/TrainingResults';
import XPToast from '@/components/training/XPToast';
import AuthModal from '@/components/AuthModal';

type Phase = 'loading' | 'reader' | 'quiz' | 'results' | 'error';

interface ReadStats {
  wordsRead: number;
  elapsedSeconds: number;
}

export default function TrainingLevelPage() {
  const params = useParams();
  const levelId = params.levelId as string;
  const { user, profile, refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [levelData, setLevelData] = useState<TrainingLevelDetailResponse | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [readStats, setReadStats] = useState<ReadStats | null>(null);
  const [result, setResult] = useState<AttemptCompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showXpToast, setShowXpToast] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [lastAnswers, setLastAnswers] = useState<Array<{ question_id: string; selected_index: number }>>([]);
  const startedRef = useRef(false);

  const loadLevel = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch(`/api/training/levels/${levelId}`);
      if (res.status === 401) {
        setError('Sign up to access this level, or try Level 1 from the training path.');
        setPhase('error');
        return;
      }
      if (res.status === 403) {
        setError('This level is locked. Pass the previous level first.');
        setPhase('error');
        return;
      }
      if (!res.ok) throw new Error('load_failed');
      const data: TrainingLevelDetailResponse = await res.json();
      setLevelData(data);
      trackTrainingEvent('training_level_viewed', profile, !!user, {
        level_id: data.level.id,
        tier_id: data.tier_id,
        passage_id: data.passage.id,
        target_wpm: data.level.target_wpm,
      });
      setPhase('reader');
    } catch {
      setError('Could not load this level.');
      setPhase('error');
    }
  }, [levelId, profile, user]);

  useEffect(() => {
    void loadLevel();
  }, [loadLevel]);

  useEffect(() => {
    if (phase !== 'reader' || !levelData || startedRef.current) return;
    startedRef.current = true;

    const startAttempt = async () => {
      const res = await fetch('/api/training/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level_id: levelId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAttemptId(data.attempt_id ?? null);
        trackTrainingEvent('training_level_started', profile, !!user, {
          level_id: levelData.level.id,
          tier_id: levelData.tier_id,
          passage_id: levelData.passage.id,
          target_wpm: levelData.level.target_wpm,
          word_count: levelData.passage.word_count,
          attempt_id: data.attempt_id,
        });
      }
    };
    void startAttempt();
  }, [phase, levelData, levelId, profile, user]);

  const handleReadComplete = (stats: ReadStats) => {
    setReadStats(stats);
    setPhase('quiz');
    trackTrainingEvent('quiz_started', profile, !!user, {
      level_id: levelData?.level.id,
      tier_id: levelData?.tier_id,
      passage_id: levelData?.passage.id,
    });
  };

  const submitQuiz = async (
    answers: Array<{ question_id: string; selected_index: number }>,
    continueAnyway = false
  ) => {
    if (!levelData || !readStats) return;

    trackTrainingEvent('quiz_completed', profile, !!user, {
      level_id: levelData.level.id,
      tier_id: levelData.tier_id,
      passage_id: levelData.passage.id,
      questions_total: answers.length,
    });

    const res = await fetch('/api/training/attempts/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level_id: levelId,
        attempt_id: attemptId,
        elapsed_seconds: readStats.elapsedSeconds,
        words_read: readStats.wordsRead,
        answers,
        continue_anyway: continueAnyway,
      }),
    });

    if (!res.ok) {
      setError('Could not save results.');
      setPhase('error');
      return;
    }

    const data: AttemptCompleteResult = await res.json();
    setLastAnswers(answers);
    setResult(data);
    setPhase('results');

    const eventProps = {
      level_id: levelData.level.id,
      tier_id: levelData.tier_id,
      passage_id: levelData.passage.id,
      target_wpm: data.target_wpm,
      actual_wpm: data.actual_wpm,
      comprehension_score: data.comprehension_pct,
      quiz_score: data.comprehension_pct,
      questions_correct: data.questions_correct,
      questions_total: data.questions_total,
      word_count: levelData.passage.word_count,
      elapsed_seconds: readStats.elapsedSeconds,
      xp_awarded: data.xp_awarded,
      passed: data.passed,
      mastered: data.mastered,
      attempt_id: data.attempt_id,
    };

    trackTrainingEvent('training_level_completed', profile, !!user, eventProps);

    if (data.xp_awarded > 0) {
      trackTrainingEvent('xp_awarded', profile, !!user, eventProps);
      setShowXpToast(true);
      setTimeout(() => setShowXpToast(false), 2500);
    }
    if (data.is_personal_best) {
      trackTrainingEvent('personal_best_set', profile, !!user, eventProps);
    }
    if (data.reader_level_up) {
      trackTrainingEvent('reader_level_up', profile, !!user, {
        reader_level: data.reader_level,
        total_xp: data.total_xp,
      });
    }
    if (data.next_level_unlocked) {
      trackTrainingEvent('tier_unlocked', profile, !!user, {
        level_id: data.next_level_id,
        tier_id: levelData.tier_id,
      });
    }

    if (data.saved) {
      await refreshProfile();
    }
  };

  const handleRetry = () => {
    trackTrainingEvent('retry_level_clicked', profile, !!user, {
      level_id: levelData?.level.id,
      tier_id: levelData?.tier_id,
    });
    startedRef.current = false;
    setReadStats(null);
    setResult(null);
    setAttemptId(null);
    void loadLevel();
  };

  const handleContinueAnyway = async () => {
    if (!levelData || !readStats || lastAnswers.length === 0) return;
    trackTrainingEvent('continue_with_low_score_clicked', profile, !!user, {
      level_id: levelData.level.id,
      tier_id: levelData.tier_id,
    });

    const res = await fetch('/api/training/attempts/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level_id: levelId,
        attempt_id: attemptId,
        elapsed_seconds: readStats.elapsedSeconds,
        words_read: readStats.wordsRead,
        answers: lastAnswers,
        continue_anyway: true,
      }),
    });

    if (res.ok) {
      const data: AttemptCompleteResult = await res.json();
      if (data.next_level_id) {
        window.location.href = `/train/${data.next_level_id}`;
      }
    }
  };

  if (phase === 'loading') {
    return (
      <div data-theme="learning" className="min-h-screen bg-surface-primary flex items-center justify-center">
        <p className="text-content-muted">Loading level...</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div data-theme="learning" className="min-h-screen bg-surface-primary flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-red-500 text-center">{error}</p>
        <Link href="/train" className="text-content-muted hover:text-brand text-sm">← Training path</Link>
      </div>
    );
  }

  if (phase === 'reader' && levelData) {
    return (
      <TrainingReader
        passageTitle={levelData.passage.title}
        passageBody={levelData.passage.body}
        targetWpm={levelData.level.target_wpm}
        onComplete={handleReadComplete}
      />
    );
  }

  if (phase === 'quiz' && levelData) {
    return (
      <QuizFlow
        questions={levelData.questions}
        onQuestionAnswered={(questionIndex, selectedIndex) => {
          trackTrainingEvent('quiz_question_answered', profile, !!user, {
            level_id: levelData.level.id,
            tier_id: levelData.tier_id,
            question_index: questionIndex,
            selected_index: selectedIndex,
          });
        }}
        onComplete={(answers) => void submitQuiz(answers)}
      />
    );
  }

  if (phase === 'results' && result) {
    return (
      <>
        <XPToast xp={result.xp_awarded} show={showXpToast} />
        <TrainingResults
          result={result}
          onRetry={handleRetry}
          onSignup={() => setShowAuthModal(true)}
          onContinueAnyway={
            result.requires_auth || result.passed
              ? undefined
              : handleContinueAnyway
          }
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signup"
          theme="learning"
        />
      </>
    );
  }

  return null;
}
