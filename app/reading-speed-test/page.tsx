import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingPageShell from '@/components/marketing/MarketingPageShell';

export const metadata: Metadata = {
  title: 'Free Reading Speed Test — WPM Test Online | SpeedRead',
  description:
    'Take a free 30-second reading speed test. Measure your WPM with comprehension checks. Compare your score and challenge friends.',
  openGraph: {
    title: 'Free Reading Speed Test — How fast can you read?',
    description: '30-second WPM test with comprehension score. Free, no account required.',
  },
};

export default function ReadingSpeedTestPage() {
  return (
    <MarketingPageShell
      title="Reading Speed Test"
      subtitle="Measure your words per minute in 30 seconds — with a comprehension check so your score is honest."
    >
      <div className="max-w-lg mx-auto space-y-6 text-center">
        <ul className="text-left text-sm text-slate-300 space-y-3 challenge-surface rounded-xl p-5">
          <li>✓ Progressive speed ramp from 300 to 900 WPM</li>
          <li>✓ Timed comprehension quiz before any WPM reveal</li>
          <li>✓ Shareable verified score — challenge a friend</li>
          <li>✓ 3 free tries, no account required</li>
        </ul>

        <Link href="/" className="block w-full px-6 py-4 btn-challenge text-lg font-semibold">
          Start the 30-Second WPM Test
        </Link>

        <p className="text-xs challenge-text-muted">
          Average adult reading speed is 200–240 WPM. Most people comfortably follow 400–600 WPM in
          our RSVP format.
        </p>

        <div className="pt-4 border-t border-white/10 text-sm challenge-text-muted">
          <p className="mb-2">After your test:</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/train" className="text-challenge-cta hover:underline">
              Continue Learning →
            </Link>
            <Link href="/adventures" className="text-challenge-cta hover:underline">
              Reading Adventures →
            </Link>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  );
}
