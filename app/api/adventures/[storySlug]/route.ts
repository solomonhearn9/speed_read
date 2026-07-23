import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveChapterStatus } from '@/lib/adventures/progress';
import { resolveAccessTier } from '@/lib/accessTier';
import { fetchIsPaidProfile } from '@/lib/profile-server';
import {
  fetchActivePuzzle,
  fetchNextPuzzleId,
  toPublicPuzzle,
} from '@/lib/puzzles';
import type { PuzzleCurrentLevel, PuzzleSegmentState } from '@/lib/puzzles/types';
import type { AdventureStoryResponse, ChapterWithStatus } from '@/lib/adventures/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { storySlug: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: story } = await service
      .from('adventure_stories')
      .select('*')
      .eq('slug', params.storySlug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const { data: chapters } = await service
      .from('adventure_chapters')
      .select('*')
      .eq('story_id', story.id)
      .order('chapter_number', { ascending: true });

    const completedChapters = new Set<number>();
    const passedChapters = new Set<number>();
    let progress = null;
    let isPaid = false;

    if (user) {
      isPaid = await fetchIsPaidProfile(service, user.id);
      const { data: userProgress } = await service
        .from('user_adventure_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .maybeSingle();

      if (userProgress) {
        progress = {
          current_chapter_number: userProgress.current_chapter_number,
          chapters_completed: userProgress.chapters_completed,
          completed_at: userProgress.completed_at,
          total_xp_earned: userProgress.total_xp_earned,
        };
        for (let i = 1; i <= userProgress.chapters_completed; i++) {
          completedChapters.add(i);
        }
      }

      const { data: passedAttempts } = await service
        .from('adventure_chapter_attempts')
        .select('chapter_id')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .eq('passed', true);

      passedAttempts?.forEach((a) => {
        const ch = (chapters ?? []).find((c) => c.id === a.chapter_id);
        if (ch) passedChapters.add(ch.chapter_number);
      });
    }

    const chaptersWithStatus: ChapterWithStatus[] = (chapters ?? []).map((ch) => {
      const accessTier = resolveAccessTier(ch.chapter_number, ch.access_tier);
      return {
        ...ch,
        access_tier: accessTier,
        status: resolveChapterStatus(
          ch.chapter_number,
          completedChapters,
          passedChapters,
          !!user,
          isPaid,
          ch.access_tier
        ),
      };
    });

    let profileData = {
      total_xp: 0,
      reader_level: 1,
      current_streak: 0,
      is_logged_in: !!user,
      is_paid: isPaid,
    };
    if (user) {
      const { data: profile } = await service
        .from('profiles')
        .select('total_xp, reader_level, current_streak')
        .eq('id', user.id)
        .single();
      if (profile) {
        profileData = {
          total_xp: profile.total_xp ?? 0,
          reader_level: profile.reader_level ?? 1,
          current_streak: profile.current_streak ?? 0,
          is_logged_in: true,
          is_paid: isPaid,
        };
      }
    }

    const puzzleId =
      chaptersWithStatus.find((c) => c.puzzle_image_id)?.puzzle_image_id ?? null;
    const puzzle = await fetchActivePuzzle(service, 'kids', puzzleId);
    const nextPuzzleId = puzzle
      ? await fetchNextPuzzleId(service, 'kids', puzzle)
      : null;

    const segments: PuzzleSegmentState[] = chaptersWithStatus.map((ch) => ({
      segment_index: ch.segment_index ?? ch.chapter_number,
      revealed: ch.status === 'completed',
      level_id: ch.id,
      level_number: ch.chapter_number,
    }));

    const revealedCount = segments.filter((s) => s.revealed).length;
    const puzzleComplete = !!puzzle && revealedCount >= puzzle.segment_count;

    const currentCh =
      chaptersWithStatus.find((c) => c.status === 'unlocked') ??
      (puzzleComplete
        ? null
        : chaptersWithStatus.find((c) => c.status === 'locked') ?? null);

    const currentLevel: PuzzleCurrentLevel | null = currentCh
      ? {
          id: currentCh.id,
          level_number: currentCh.chapter_number,
          href:
            currentCh.status === 'locked'
              ? null
              : `/adventures/${story.slug}/${currentCh.slug}`,
          access_tier: currentCh.access_tier,
          status: currentCh.status === 'completed' ? 'completed' : currentCh.status,
          target_wpm: currentCh.target_wpm,
          xp_reward: currentCh.xp_reward + currentCh.completion_bonus_xp,
          title: currentCh.title,
        }
      : null;

    let newlyRevealed: number | null = null;
    if (user) {
      const { data: latestPass } = await service
        .from('adventure_chapter_attempts')
        .select('chapter_id, completed_at')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .eq('passed', true)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestPass?.completed_at) {
        const ageMs = Date.now() - new Date(latestPass.completed_at).getTime();
        if (ageMs < 2 * 60 * 1000) {
          const ch = chaptersWithStatus.find((c) => c.id === latestPass.chapter_id);
          newlyRevealed = ch?.segment_index ?? ch?.chapter_number ?? null;
        }
      }
    }

    // Average WPM from best passed attempts for this story
    let averageWpm: number | null = null;
    if (user) {
      const { data: attempts } = await service
        .from('adventure_chapter_attempts')
        .select('words_read, elapsed_seconds')
        .eq('user_id', user.id)
        .eq('story_id', story.id)
        .eq('passed', true);
      const wpms = (attempts ?? [])
        .filter((a) => a.words_read && a.elapsed_seconds && a.elapsed_seconds > 0)
        .map((a) => Math.round((a.words_read! / a.elapsed_seconds!) * 60));
      if (wpms.length) {
        averageWpm = wpms.reduce((s, n) => s + n, 0) / wpms.length;
      }
    }

    const response: AdventureStoryResponse = {
      story,
      chapters: chaptersWithStatus,
      progress: user
        ? progress ?? {
            current_chapter_number: 1,
            chapters_completed: 0,
            completed_at: null,
            total_xp_earned: 0,
          }
        : null,
      profile: profileData,
      puzzle: puzzle
        ? toPublicPuzzle(puzzle, { revealedCount, nextPuzzleId })
        : null,
      segments,
      newly_revealed_segment: newlyRevealed,
      current_level: currentLevel,
      puzzle_complete: puzzleComplete,
      track_stats: {
        total_levels: chaptersWithStatus.length,
        levels_completed: revealedCount,
        average_wpm: averageWpm,
        current_streak: profileData.current_streak,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[adventures/story]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
