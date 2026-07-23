export type PuzzleTrack = 'adult' | 'kids';

export interface Puzzle {
  id: string;
  track: PuzzleTrack;
  full_image_url: string;
  segment_count: number;
  title: string;
  reveal_message: string;
  sort_order: number;
  is_active: boolean;
}

/** Public puzzle payload — mystery fields omitted until earned. */
export interface PuzzlePublic {
  id: string;
  track: PuzzleTrack;
  segment_count: number;
  /**
   * Present only when ≥1 segment is revealed (for board rendering).
   * Never sent before the first completion — no silhouette leak.
   */
  render_image_url?: string;
  /** Only present when every segment is revealed. */
  full_image_url?: string;
  title?: string;
  reveal_message?: string;
  next_puzzle_id: string | null;
}

export interface PuzzleSegmentState {
  segment_index: number;
  revealed: boolean;
  level_id: string;
  level_number: number;
}

export interface PuzzleCurrentLevel {
  id: string;
  level_number: number;
  href: string | null;
  access_tier: 'free' | 'signup' | 'subscription';
  status: 'locked' | 'unlocked' | 'completed' | 'mastered';
  target_wpm: number | null;
  xp_reward: number | null;
  /** Level title is OK to show — it's the reading challenge, not the puzzle mystery. */
  title: string;
}

export interface PuzzlePathStats {
  total_levels: number;
  levels_completed: number;
  average_wpm: number | null;
  current_streak: number;
}

export interface PuzzlePathResponse {
  puzzle: PuzzlePublic | null;
  segments: PuzzleSegmentState[];
  /** Highest segment_index revealed this session entry (for highlight anim). */
  newly_revealed_segment: number | null;
  current_level: PuzzleCurrentLevel | null;
  /** True when all segments revealed. */
  puzzle_complete: boolean;
  track_stats: PuzzlePathStats;
  profile: {
    total_xp: number;
    reader_level: number;
    current_streak: number;
    is_logged_in: boolean;
    is_paid: boolean;
  };
}
