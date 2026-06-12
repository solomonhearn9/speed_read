'use client';

import Link from 'next/link';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';

const STEPS = [
  {
    title: 'Words appear one at a time',
    body: 'Each word is shown in the center of the screen so your eyes stay fixed instead of jumping left to right.',
  },
  {
    title: 'The anchor character guides focus',
    body: 'A highlighted character in each word marks the Optimal Recognition Point — where your eye naturally locks on for fastest recognition.',
  },
  {
    title: 'Adjust speed to your level',
    body: 'Use the slider to read anywhere from 100 to 1000 WPM. Start slow, then work your way up as your brain adapts.',
  },
  {
    title: 'Keyboard controls',
    body: 'Press Space to play or pause. Use arrow keys to move between sentences. Press ESC or open Full Text View to see the whole document.',
  },
  {
    title: 'Train or read your own content',
    body: 'Take the 30-second challenge, follow structured training levels, or paste your own text, upload a file, or scrape a URL.',
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingPageShell
      title="How It Works"
      subtitle="Rapid Serial Visual Presentation (RSVP) removes eye movement so you can read faster with better focus."
    >
      <div className="space-y-4">
        {STEPS.map((step, index) => (
          <div key={step.title} className="challenge-surface rounded-xl p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan mb-2">
              Step {index + 1}
            </p>
            <h2 className="text-lg font-bold text-white mb-2">{step.title}</h2>
            <p className="text-sm challenge-text-muted leading-relaxed">{step.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="btn-challenge inline-block px-8 py-3 text-sm md:text-base">
          Try the 30-Second Challenge
        </Link>
      </div>
    </MarketingPageShell>
  );
}
