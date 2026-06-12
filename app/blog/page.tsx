'use client';

import Link from 'next/link';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';

const POSTS = [
  {
    slug: 'why-rsvp-reading-works',
    title: 'Why RSVP Reading Works',
    excerpt: 'How eliminating saccades can double your reading speed without sacrificing comprehension.',
    date: 'June 2026',
  },
  {
    slug: 'optimal-recognition-point',
    title: 'The Optimal Recognition Point',
    excerpt: 'Why the highlighted character in each word helps your eyes lock on faster.',
    date: 'June 2026',
  },
  {
    slug: 'building-a-reading-streak',
    title: 'Building a Reading Streak',
    excerpt: 'Tips for using daily training and adventures to make speed reading a habit.',
    date: 'June 2026',
  },
];

export default function BlogPage() {
  return (
    <MarketingPageShell
      title="Blog"
      subtitle="Tips, research, and updates on reading faster with focus."
    >
      <div className="space-y-4">
        {POSTS.map((post) => (
          <article key={post.slug} className="challenge-surface rounded-xl p-5 md:p-6">
            <p className="text-xs challenge-text-muted mb-2">{post.date}</p>
            <h2 className="text-lg font-bold text-white mb-2">{post.title}</h2>
            <p className="text-sm challenge-text-muted leading-relaxed">{post.excerpt}</p>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm challenge-text-muted">
        Full articles coming soon.{' '}
        <Link href="/" className="text-brand-cyan hover:text-white transition-colors">
          Try SpeedRead.cc now
        </Link>
      </p>
    </MarketingPageShell>
  );
}
