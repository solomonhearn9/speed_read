'use client';

import AdventureStoryPage from '@/components/adventures/AdventureStoryPage';

export default function StoryPage({ params }: { params: { storySlug: string } }) {
  return <AdventureStoryPage storySlug={params.storySlug} />;
}
