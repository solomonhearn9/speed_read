'use client';

import { useEffect, useRef, useState } from 'react';
import { useReadingStore } from '@/lib/store';
import { trackEvent } from '@/lib/analytics';
import {
  VIRAL_TEST_QUIZ_QUESTIONS,
  VIRAL_TEST_QUIZ_QUESTION_SEC,
  gradeViralTestQuiz,
} from '@/lib/viralTest';

export default function ViralTestQuiz() {
  const viralTestDraft = useReadingStore((state) => state.viralTestDraft);
  const completeViralTestQuiz = useReadingStore((state) => state.completeViralTestQuiz);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ question_id: string; selected_index: number }>>([]);
  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(VIRAL_TEST_QUIZ_QUESTION_SEC);
  const answeringRef = useRef(false);
  const answersRef = useRef(answers);
  const currentIndexRef = useRef(currentIndex);
  const timerIdRef = useRef<number | null>(null);
  answersRef.current = answers;
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    if (!started && viralTestDraft) {
      trackEvent('challenge_quiz_started', { speed_wpm: viralTestDraft.wpm });
      setStarted(true);
    }
  }, [started, viralTestDraft]);

  const clearQuestionTimer = () => {
    if (timerIdRef.current != null) {
      window.clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  };

  const finishOrAdvance = (newAnswers: Array<{ question_id: string; selected_index: number }>) => {
    const index = currentIndexRef.current;
    if (index < VIRAL_TEST_QUIZ_QUESTIONS.length - 1) {
      window.setTimeout(() => {
        answeringRef.current = false;
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
        setSecondsLeft(VIRAL_TEST_QUIZ_QUESTION_SEC);
      }, 280);
    } else {
      window.setTimeout(() => {
        const draft = useReadingStore.getState().viralTestDraft;
        const grade = gradeViralTestQuiz(newAnswers);
        trackEvent('challenge_quiz_completed', {
          speed_wpm: draft?.wpm,
          comprehension_score: grade.correct,
          comprehension_total: grade.total,
          comprehension_pct: grade.pct,
        });
        completeViralTestQuiz(grade.correct, grade.total, grade.pct);
      }, 280);
    }
  };

  const submitAnswer = (optionIndex: number) => {
    const question = VIRAL_TEST_QUIZ_QUESTIONS[currentIndexRef.current];
    if (!question || answeringRef.current) return;
    answeringRef.current = true;
    clearQuestionTimer();
    setSelectedIndex(optionIndex);
    (document.activeElement as HTMLElement | null)?.blur();

    const newAnswer = { question_id: question.id, selected_index: optionIndex };
    const newAnswers = [...answersRef.current, newAnswer];
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
    finishOrAdvance(newAnswers);
  };

  // Per-question countdown — timeout counts as incorrect (anti-lookup / no reread).
  useEffect(() => {
    if (!viralTestDraft) return;

    answeringRef.current = false;
    setSecondsLeft(VIRAL_TEST_QUIZ_QUESTION_SEC);
    clearQuestionTimer();

    const startedAt = Date.now();
    const tick = () => {
      const remaining = Math.max(
        0,
        VIRAL_TEST_QUIZ_QUESTION_SEC - (Date.now() - startedAt) / 1000
      );
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        submitAnswer(-1);
        return;
      }
      timerIdRef.current = window.setTimeout(tick, 50);
    };

    timerIdRef.current = window.setTimeout(tick, 50);
    return clearQuestionTimer;
  }, [currentIndex, viralTestDraft]);

  if (!viralTestDraft) return null;

  const question = VIRAL_TEST_QUIZ_QUESTIONS[currentIndex];
  if (!question) return null;

  const timerPct = (secondsLeft / VIRAL_TEST_QUIZ_QUESTION_SEC) * 100;
  const timerUrgent = secondsLeft <= 3;

  return (
    <div
      data-theme="challenge"
      className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-challenge-bg-start to-challenge-bg-end p-6"
    >
      <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
      <div className="relative min-h-full flex items-center justify-center">
        <div className="max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs challenge-text-muted uppercase tracking-widest font-semibold">
              Comprehension Check · {currentIndex + 1} / {VIRAL_TEST_QUIZ_QUESTIONS.length}
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${
                timerUrgent ? 'text-red-400' : 'text-challenge-cta'
              }`}
              aria-live="polite"
            >
              {Math.ceil(secondsLeft)}s
            </p>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full mb-2 overflow-hidden">
            <div
              className="h-full bg-challenge-cta rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / VIRAL_TEST_QUIZ_QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-75 linear ${
                timerUrgent ? 'bg-red-400' : 'bg-white/40'
              }`}
              style={{ width: `${timerPct}%` }}
            />
          </div>

          <h2 className="text-lg md:text-xl font-bold mb-8 leading-relaxed text-white text-center">
            {question.prompt}
          </h2>

          <div className="space-y-3" key={currentIndex}>
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => submitAnswer(idx)}
                disabled={selectedIndex !== null}
                className={`w-full text-left px-5 py-4 challenge-surface-solid border transition-all duration-200 text-sm md:text-base outline-none disabled:opacity-80 ${
                  selectedIndex === idx
                    ? 'border-challenge-cta bg-challenge-cta/10 ring-2 ring-challenge-cta/20 text-white'
                    : 'border-white/10 text-slate-200 hover:border-challenge-cta/40'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
