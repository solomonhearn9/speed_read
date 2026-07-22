const CHAPTER_LOCK_PREFIX = 'speedread-chapter-lock-';

function tomorrowMidnightLocal(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function setChapterLockedUntil(chapterSlug: string): void {
  if (typeof window === 'undefined') return;
  const until = tomorrowMidnightLocal().toISOString();
  localStorage.setItem(`${CHAPTER_LOCK_PREFIX}${chapterSlug}`, until);
}

export function getChapterLockedUntil(chapterSlug: string): Date | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`${CHAPTER_LOCK_PREFIX}${chapterSlug}`);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isChapterLockedBySchedule(chapterSlug: string): boolean {
  const until = getChapterLockedUntil(chapterSlug);
  if (!until) return false;
  return Date.now() < until.getTime();
}

export function getChapterLockMessage(chapterSlug: string): string | null {
  if (!isChapterLockedBySchedule(chapterSlug)) return null;
  const until = getChapterLockedUntil(chapterSlug);
  if (!until) return 'Come back tomorrow to unlock this chapter.';
  const formatted = until.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return `Come back ${formatted} to unlock this chapter.`;
}
