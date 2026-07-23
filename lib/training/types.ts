import type { AccessTier } from '@/lib/accessTier';
import type {
  PuzzleCurrentLevel,
  PuzzlePathStats,
  PuzzlePublic,
  PuzzleSegmentState,
} from '@/lib/puzzles/types';
import type { LevelProgressStatus } from './progress';

export interface TrainingTier {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_paid_only: boolean;
}

export interface TrainingLevel {
  id: string;
  tier_id: string;
  slug: string;
  title: string;
  level_number: number;
  target_wpm: number;
  passage_id: string;
  quiz_id: string;
  xp_base: number;
  xp_pass: number;
  xp_mastery: number;
  min_correct_to_pass: number;
  is_paid_only: boolean;
  access_tier?: AccessTier | null;
  sort_order: number;
  puzzle_image_id?: string | null;
  segment_index?: number | null;
}

export interface Passage {
  id: string;
  slug: string;
  title: string;
  body: string;
  word_count: number;
  difficulty: string;
}

export interface QuizQuestionPublic {
  id: string;
  sort_order: number;
  prompt: string;
  options: string[];
}

export interface LevelWithProgress extends TrainingLevel {
  status: LevelProgressStatus;
  access_tier: AccessTier;
  best_wpm: number | null;
  best_comprehension_pct: number | null;
  best_quiz_score: number | null;
  attempts_count: number;
  recommend_retry: boolean;
}

export interface TrainingPathResponse {
  tiers: Array<TrainingTier & { levels: LevelWithProgress[] }>;
  profile: {
    total_xp: number;
    reader_level: number;
    current_streak: number;
    longest_streak: number;
    is_logged_in: boolean;
    is_paid: boolean;
  };
  puzzle: PuzzlePublic | null;
  segments: PuzzleSegmentState[];
  newly_revealed_segment: number | null;
  current_level: PuzzleCurrentLevel | null;
  puzzle_complete: boolean;
  track_stats: PuzzlePathStats;
}

export interface TrainingLevelDetailResponse {
  level: TrainingLevel;
  passage: Passage;
  questions: QuizQuestionPublic[];
  tier_id: string;
  tier_slug: string;
}

export interface AttemptCompleteResult {
  attempt_id: string;
  saved: boolean;
  requires_auth: boolean;
  /** Gate for continuing after this level (cliffhanger conversion). */
  continue_gate: 'none' | 'signup' | 'subscription';
  level_id: string;
  level_title: string;
  level_number: number;
  target_wpm: number;
  actual_wpm: number;
  questions_correct: number;
  questions_total: number;
  comprehension_pct: number;
  passed: boolean;
  mastered: boolean;
  xp_awarded: number;
  is_personal_best: boolean;
  next_level_id: string | null;
  next_level_wpm: number | null;
  next_level_title: string | null;
  next_level_unlocked: boolean;
  reader_level: number;
  total_xp: number;
  reader_level_up: boolean;
  current_streak: number;
}
