const STORAGE_KEY = 'speed-reader-analytics-session-flags';

export interface AnalyticsSessionFlags {
  challenge_completed: boolean;
  training_user: boolean;
  adventure_user: boolean;
}

const DEFAULT_FLAGS: AnalyticsSessionFlags = {
  challenge_completed: false,
  training_user: false,
  adventure_user: false,
};

function readFlags(): AnalyticsSessionFlags {
  if (typeof window === 'undefined') return { ...DEFAULT_FLAGS };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FLAGS };
    return { ...DEFAULT_FLAGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

function writeFlags(flags: AnalyticsSessionFlags): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // Non-blocking
  }
}

export function getSessionFlags(): AnalyticsSessionFlags {
  return readFlags();
}

export function updateSessionFlagsFromEvent(
  eventName: string,
  _properties: Record<string, unknown> = {}
): AnalyticsSessionFlags {
  const flags = readFlags();
  let changed = false;

  if (eventName === 'challenge_completed' && !flags.challenge_completed) {
    flags.challenge_completed = true;
    changed = true;
  }

  if (
    !flags.training_user &&
    (eventName === 'training_path_viewed' ||
      eventName === 'training_level_started' ||
      eventName === 'training_level_viewed')
  ) {
    flags.training_user = true;
    changed = true;
  }

  if (
    !flags.adventure_user &&
    (eventName === 'adventures_home_viewed' ||
      eventName === 'adventure_chapter_started' ||
      eventName === 'adventure_chapter_viewed' ||
      eventName === 'adventure_story_viewed')
  ) {
    flags.adventure_user = true;
    changed = true;
  }

  if (changed) writeFlags(flags);
  return flags;
}

export function deriveUserType(
  isLoggedIn: boolean,
  planStatus: string
): 'anonymous' | 'free' | 'paid' {
  if (!isLoggedIn) return 'anonymous';
  if (planStatus === 'monthly' || planStatus === 'lifetime') return 'paid';
  return 'free';
}
