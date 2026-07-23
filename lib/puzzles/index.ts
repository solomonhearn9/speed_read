import type { SupabaseClient } from '@supabase/supabase-js';
import type { Puzzle, PuzzlePublic, PuzzleTrack } from './types';

export function toPublicPuzzle(
  puzzle: Puzzle,
  opts: {
    revealedCount: number;
    nextPuzzleId: string | null;
  }
): PuzzlePublic {
  const fullyRevealed = opts.revealedCount >= puzzle.segment_count;
  const base: PuzzlePublic = {
    id: puzzle.id,
    track: puzzle.track,
    segment_count: puzzle.segment_count,
    next_puzzle_id: opts.nextPuzzleId,
  };

  // No image URL until segment 1 is uncovered.
  if (opts.revealedCount <= 0) return base;

  if (!fullyRevealed) {
    return {
      ...base,
      render_image_url: puzzle.full_image_url,
    };
  }

  return {
    ...base,
    render_image_url: puzzle.full_image_url,
    full_image_url: puzzle.full_image_url,
    title: puzzle.title,
    reveal_message: puzzle.reveal_message,
  };
}

/** Image URL for rendering revealed segments — never expose until segment 1+. */
export function getPuzzleImageUrlForRender(
  puzzle: Puzzle,
  revealedCount: number
): string | null {
  if (revealedCount <= 0) return null;
  return puzzle.full_image_url;
}

export async function fetchActivePuzzle(
  service: SupabaseClient,
  track: PuzzleTrack,
  puzzleId?: string | null
): Promise<Puzzle | null> {
  if (puzzleId) {
    const { data } = await service
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .eq('is_active', true)
      .maybeSingle();
    return (data as Puzzle | null) ?? null;
  }

  const { data } = await service
    .from('puzzles')
    .select('*')
    .eq('track', track)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as Puzzle | null) ?? null;
}

export async function fetchNextPuzzleId(
  service: SupabaseClient,
  track: PuzzleTrack,
  current: Puzzle
): Promise<string | null> {
  const { data } = await service
    .from('puzzles')
    .select('id')
    .eq('track', track)
    .eq('is_active', true)
    .gt('sort_order', current.sort_order)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export { buildPuzzleLayout, segmentImageStyle } from './layout';
