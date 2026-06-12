export type ChapterStatus = 'locked' | 'unlocked' | 'completed';

export interface AdventureStory {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  theme: string | null;
  total_chapters: number;
  is_active: boolean;
}

export interface AdventureChapter {
  id: string;
  story_id: string;
  slug: string;
  chapter_number: number;
  title: string;
  body: string;
  word_count: number;
  target_wpm: number;
  xp_reward: number;
  completion_bonus_xp: number;
  reward_name: string | null;
}

export interface AdventureQuestionPublic {
  id: string;
  sort_order: number;
  prompt: string;
  options: string[];
}

export interface UserAdventureProgress {
  current_chapter_number: number;
  chapters_completed: number;
  completed_at: string | null;
  total_xp_earned: number;
}

export interface ChapterWithStatus extends AdventureChapter {
  status: ChapterStatus;
}

export interface AdventuresListResponse {
  stories: Array<AdventureStory & {
    progress: UserAdventureProgress | null;
    is_logged_in: boolean;
  }>;
}

export interface AdventureStoryResponse {
  story: AdventureStory;
  chapters: ChapterWithStatus[];
  progress: UserAdventureProgress | null;
  profile: { total_xp: number; reader_level: number; is_logged_in: boolean; is_paid: boolean };
}

export interface AdventureChapterDetailResponse {
  story: AdventureStory;
  chapter: AdventureChapter;
  questions: AdventureQuestionPublic[];
  status: ChapterStatus;
  chapter_number: number;
  total_chapters: number;
}

export interface AdventureCompleteResult {
  attempt_id: string;
  saved: boolean;
  requires_auth: boolean;
  story_id: string;
  story_slug: string;
  chapter_id: string;
  chapter_slug: string;
  chapter_number: number;
  chapter_title: string;
  questions_correct: number;
  questions_total: number;
  comprehension_pct: number;
  passed: boolean;
  xp_awarded: number;
  reward_name: string | null;
  story_completed: boolean;
  next_chapter_slug: string | null;
  next_chapter_unlocked: boolean;
  total_xp: number;
  reader_level: number;
}
