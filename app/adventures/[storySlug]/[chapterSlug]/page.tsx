'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useChapterAbandonment } from '@/lib/analytics';
import { trackAdventureEvent } from '@/lib/adventures/analytics';
import {
  TOMORROW_LOCK_AFTER_CHAPTER,
  TOMORROW_LOCK_CHAPTER_SLUG,
} from '@/lib/adventures/constants';
import {
  getChapterLockMessage,
  isChapterLockedBySchedule,
  setChapterLockedUntil,
} from '@/lib/adventures/chapterLock';
import type { AdventureChapterDetailResponse, AdventureCompleteResult } from '@/lib/adventures/types';
import AdventureReader from '@/components/adventures/AdventureReader';
import AdventureQuizFlow from '@/components/adventures/AdventureQuizFlow';
import AdventureResults from '@/components/adventures/AdventureResults';
import AuthModal from '@/components/AuthModal';
import UpgradeModal from '@/components/UpgradeModal';
import { trackEvent } from '@/lib/analytics';
import '@/components/adventures/adventure-theme.css';

type Phase = 'loading' | 'reader' | 'quiz' | 'results' | 'error';

export default function AdventureChapterPage() {
  const params = useParams();
  const storySlug = params.storySlug as string;
  const chapterSlug = params.chapterSlug as string;
  const { user, profile, refreshProfile } = useAuth();

  const [phase, setPhase] = useState<Phase>('loading');
  const [data, setData] = useState<AdventureChapterDetailResponse | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [readStats, setReadStats] = useState<{ wordsRead: number; elapsedSeconds: number } | null>(null);
  const [result, setResult] = useState<AdventureCompleteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const startedRef = useRef(false);

  useChapterAbandonment({
    enabled: phase === 'reader' || phase === 'quiz',
    phase: phase === 'reader' || phase === 'quiz' ? phase : null,
    storyId: data?.story.id,
    storySlug,
    chapterId: data?.chapter.id,
    chapterSlug,
    chapterNumber: data?.chapter_number,
    wordsRead: readStats?.wordsRead,
    elapsedSeconds: readStats?.elapsedSeconds,
  });

  const loadChapter = useCallback(async () => {
    setPhase('loading');
    setError(null);

    if (
      chapterSlug === TOMORROW_LOCK_CHAPTER_SLUG &&
      isChapterLockedBySchedule(TOMORROW_LOCK_CHAPTER_SLUG)
    ) {
      setError(getChapterLockMessage(TOMORROW_LOCK_CHAPTER_SLUG) ?? 'Come back tomorrow to unlock this chapter.');
      setPhase('error');
      return;
    }

    try {
      const res = await fetch(`/api/adventures/${storySlug}/chapters/${chapterSlug}`);
      if (res.status === 401) {
        setError('Sign in to read adventure chapters.');
        setPhase('error');
        return;
      }
      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}));
        if (payload.error === 'subscription_required') {
          setError('Subscribe to Pro to play this chapter.');
          setShowUpgradeModal(true);
          setPhase('error');
          return;
        }
        setError('This chapter is locked. Pass the previous chapter first.');
        setPhase('error');
        return;
      }
      if (!res.ok) throw new Error('load failed');
      const json: AdventureChapterDetailResponse = await res.json();
      setData(json);
      trackAdventureEvent('adventure_chapter_viewed', profile, !!user, {
        story_id: json.story.id,
        story_slug: storySlug,
        chapter_id: json.chapter.id,
        chapter_slug: chapterSlug,
        chapter_number: json.chapter_number,
      });
      setPhase('reader');
    } catch {
      setError('Could not load chapter.');
      setPhase('error');
    }
  }, [storySlug, chapterSlug, profile, user]);

  useEffect(() => {
    void loadChapter();
  }, [loadChapter]);

  useEffect(() => {
    if (phase !== 'reader' || !data || startedRef.current) return;
    startedRef.current = true;

    const start = async () => {
      const res = await fetch('/api/adventures/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story_id: data.story.id,
          chapter_id: data.chapter.id,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        setAttemptId(j.attempt_id ?? null);
        trackAdventureEvent('adventure_chapter_started', profile, !!user, {
          story_id: data.story.id,
          story_slug: storySlug,
          chapter_id: data.chapter.id,
          chapter_slug: chapterSlug,
          chapter_number: data.chapter_number,
          target_wpm: data.chapter.target_wpm,
          word_count: data.chapter.word_count,
        });
      }
    };
    void start();
  }, [phase, data, profile, user, storySlug, chapterSlug]);

  const submitQuiz = async (answers: Array<{ question_id: string; selected_index: number }>) => {
    if (!data || !readStats) return;

    trackAdventureEvent('adventure_quiz_completed', profile, !!user, {
      story_id: data.story.id,
      story_slug: storySlug,
      chapter_id: data.chapter.id,
      questions_total: answers.length,
    });

    const res = await fetch('/api/adventures/attempts/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attempt_id: attemptId,
        story_id: data.story.id,
        chapter_id: data.chapter.id,
        answers,
        elapsed_seconds: readStats.elapsedSeconds,
        words_read: readStats.wordsRead,
      }),
    });

    if (!res.ok) {
      setError('Could not save results.');
      setPhase('error');
      return;
    }

    const completeResult: AdventureCompleteResult = await res.json();
    setResult(completeResult);
    setPhase('results');

    const props = {
      story_id: data.story.id,
      story_slug: storySlug,
      chapter_id: data.chapter.id,
      chapter_slug: chapterSlug,
      chapter_number: data.chapter_number,
      target_wpm: data.chapter.target_wpm,
      words_read: readStats.wordsRead,
      elapsed_seconds: readStats.elapsedSeconds,
      questions_correct: completeResult.questions_correct,
      questions_total: completeResult.questions_total,
      comprehension_pct: completeResult.comprehension_pct,
      xp_awarded: completeResult.xp_awarded,
      passed: completeResult.passed,
    };

    trackAdventureEvent('adventure_chapter_completed', profile, !!user, props);
    if (completeResult.xp_awarded > 0) {
      trackAdventureEvent('adventure_xp_awarded', profile, !!user, props);
    }
    if (completeResult.story_completed) {
      trackAdventureEvent('adventure_story_completed', profile, !!user, props);
    }
    if (
      completeResult.passed &&
      data.chapter_number === TOMORROW_LOCK_AFTER_CHAPTER &&
      completeResult.next_chapter_slug === TOMORROW_LOCK_CHAPTER_SLUG
    ) {
      setChapterLockedUntil(TOMORROW_LOCK_CHAPTER_SLUG);
    }
    if (completeResult.requires_auth) {
      trackAdventureEvent('adventure_signup_prompt_viewed', profile, false, props);
    }

    if (completeResult.saved) await refreshProfile();
  };

  const handleRetry = () => {
    trackAdventureEvent('adventure_retry_clicked', profile, !!user, {
      story_id: data?.story.id,
      chapter_slug: chapterSlug,
    });
    startedRef.current = false;
    setReadStats(null);
    setResult(null);
    setAttemptId(null);
    void loadChapter();
  };

  if (phase === 'loading') {
    return (
      <div className="adventure-bg min-h-screen flex items-center justify-center text-gray-400">
        Loading chapter...
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <>
        <div className="adventure-bg min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-red-400">
          <p className="text-center">{error}</p>
          <Link href="/adventures" className="text-gray-400 text-sm">← Adventures</Link>
        </div>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="map_subscription_required"
          onRequireAuth={() => {
            setShowUpgradeModal(false);
            setShowAuthModal(true);
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signup"
        />
      </>
    );
  }

  if (phase === 'reader' && data) {
    return (
      <AdventureReader
        storyTitle={data.story.title}
        chapterTitle={data.chapter.title}
        chapterNumber={data.chapter_number}
        totalChapters={data.total_chapters}
        passageBody={data.chapter.body}
        targetWpm={data.chapter.target_wpm}
        storySlug={storySlug}
        readerLevel={user ? profile?.reader_level : undefined}
        totalXp={user ? profile?.total_xp : undefined}
        onComplete={(stats) => {
          setReadStats(stats);
          setPhase('quiz');
          trackAdventureEvent('adventure_quiz_started', profile, !!user, {
            story_id: data.story.id,
            chapter_id: data.chapter.id,
          });
        }}
      />
    );
  }

  if (phase === 'quiz' && data) {
    return (
      <AdventureQuizFlow
        questions={data.questions}
        onQuestionAnswered={(index, selected) => {
          trackAdventureEvent('adventure_quiz_question_answered', profile, !!user, {
            story_id: data.story.id,
            chapter_id: data.chapter.id,
            question_index: index,
            selected_index: selected,
          });
        }}
        onComplete={(answers) => void submitQuiz(answers)}
      />
    );
  }

  if (phase === 'results' && result) {
    return (
      <>
        <AdventureResults
          result={result}
          storySlug={storySlug}
          onRetry={handleRetry}
          onSignup={() => {
            trackAdventureEvent('adventure_signup_clicked', profile, false);
            setShowAuthModal(true);
          }}
          onSubscribe={() => setShowUpgradeModal(true)}
          onNextChapter={
            result.next_chapter_slug && result.continue_gate === 'none'
              ? () => {
                  trackAdventureEvent('adventure_next_chapter_clicked', profile, !!user, {
                    story_slug: storySlug,
                    chapter_slug: result.next_chapter_slug,
                  });
                  window.location.href = `/adventures/${storySlug}/${result.next_chapter_slug}`;
                }
              : undefined
          }
        />
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="map_subscription_required"
          onRequireAuth={() => {
            setShowUpgradeModal(false);
            setShowAuthModal(true);
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode="signup"
          onSuccess={() => {
            trackEvent('signup_complete', { track: 'kids', source: 'cliffhanger' });
            setShowAuthModal(false);
            if (result.next_chapter_slug) {
              window.location.href = `/adventures/${storySlug}/${result.next_chapter_slug}`;
            } else {
              window.location.href = `/adventures/${storySlug}`;
            }
          }}
        />
      </>
    );
  }

  return null;
}
