import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { resolveChapterStatus } from '@/lib/adventures/progress';
import { resolveAccessTier } from '@/lib/accessTier';
import { fetchIsPaidProfile } from '@/lib/profile-server';
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

    let profileData = { total_xp: 0, reader_level: 1, is_logged_in: !!user, is_paid: isPaid };
    if (user) {
      const { data: profile } = await service
        .from('profiles')
        .select('total_xp, reader_level')
        .eq('id', user.id)
        .single();
      if (profile) {
        profileData = {
          total_xp: profile.total_xp ?? 0,
          reader_level: profile.reader_level ?? 1,
          is_logged_in: true,
          is_paid: isPaid,
        };
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
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[adventures/story]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
