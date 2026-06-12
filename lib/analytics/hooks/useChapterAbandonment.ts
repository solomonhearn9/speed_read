'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

export type AbandonPhase = 'reader' | 'quiz';

interface ChapterAbandonmentOptions {
  enabled: boolean;
  phase: AbandonPhase | null;
  storyId?: string;
  storySlug?: string;
  chapterId?: string;
  chapterSlug?: string;
  chapterNumber?: number;
  wordsRead?: number;
  elapsedSeconds?: number;
}

export function useChapterAbandonment(options: ChapterAbandonmentOptions): void {
  const trackedRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    trackedRef.current = false;
  }, [options.chapterId, options.phase]);

  useEffect(() => {
    const maybeTrack = (reason: string) => {
      const opts = optionsRef.current;
      if (!opts.enabled || !opts.phase || trackedRef.current) return;
      if (opts.phase !== 'reader' && opts.phase !== 'quiz') return;

      trackedRef.current = true;
      trackEvent('chapter_abandoned', {
        story_id: opts.storyId,
        story_slug: opts.storySlug,
        chapter_id: opts.chapterId,
        chapter_slug: opts.chapterSlug,
        chapter_number: opts.chapterNumber,
        abandon_phase: opts.phase,
        abandon_reason: reason,
        words_read: opts.wordsRead,
        elapsed_seconds: opts.elapsedSeconds,
        funnel: 'adventure',
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        maybeTrack('tab_hidden');
      }
    };

    const handlePageHide = () => {
      maybeTrack('page_hide');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      maybeTrack('navigate_away');
    };
  }, [
    options.enabled,
    options.phase,
    options.storyId,
    options.chapterSlug,
    options.chapterId,
    options.chapterNumber,
  ]);
}
