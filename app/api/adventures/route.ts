import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AdventuresListResponse } from '@/lib/adventures/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const service = createServiceClient();

    const { data: stories, error } = await service
      .from('adventure_stories')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error || !stories?.length) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    let progressMap = new Map<string, {
      current_chapter_number: number;
      chapters_completed: number;
      completed_at: string | null;
      total_xp_earned: number;
    }>();

    if (user) {
      const { data: progressRows } = await service
        .from('user_adventure_progress')
        .select('*')
        .eq('user_id', user.id);

      progressRows?.forEach((row) => {
        progressMap.set(row.story_id, {
          current_chapter_number: row.current_chapter_number,
          chapters_completed: row.chapters_completed,
          completed_at: row.completed_at,
          total_xp_earned: row.total_xp_earned,
        });
      });
    }

    const response: AdventuresListResponse = {
      stories: stories.map((story) => ({
        ...story,
        progress: user
          ? progressMap.get(story.id) ?? {
              current_chapter_number: 1,
              chapters_completed: 0,
              completed_at: null,
              total_xp_earned: 0,
            }
          : null,
        is_logged_in: !!user,
      })),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[adventures]', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
