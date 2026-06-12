'use client';

import Image from 'next/image';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 6l2.5 2.5 4.5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 3a2 2 0 00-2 2v10.5a.5.5 0 00.74.43L5 14.5l2.26 1.43a.5.5 0 00.52 0L10 14.5l2.26 1.43a.5.5 0 00.52 0L15 14.5l2.26 1.43A.5.5 0 0018 15.5V5a2 2 0 00-2-2H4zm0 2h10v8.36l-1.76-1.11a.5.5 0 00-.52 0L10 13.5 7.28 12.25a.5.5 0 00-.52 0L4 13.36V5z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2l2.5 3h5l-4 9H6.5l-4-9h5L10 2zm0 3.2L8.9 6h2.2L10 5.2zM5.6 8l3.2 7h2.4l3.2-7H5.6z" />
    </svg>
  );
}

export default function LandingFeatureCards() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
      <Link
        href="/train"
        onClick={() => trackEvent('training_path_viewed', { source: 'landing' })}
        className="landing-feature-card landing-feature-card--adult group"
      >
        <div className="landing-feature-card__bg">
          <Image src="/adult_card.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="landing-feature-card__overlay landing-feature-card__overlay--adult" />
        </div>

        <div className="landing-feature-card__content">
          <div className="landing-feature-card__icon-ring landing-feature-card__icon-ring--adult">
            <Image src="/adult_icon.png" alt="" width={48} height={48} className="rounded-full" />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
            Become a Better Reader
          </h3>
          <p className="mt-2 text-sm text-slate-200/90 leading-relaxed">
            Build speed and comprehension with structured training.
          </p>

          <ul className="mt-4 space-y-2.5 text-sm text-slate-100">
            <li className="flex items-center gap-2.5">
              <span className="landing-feature-card__bullet landing-feature-card__bullet--adult">
                <CheckIcon />
              </span>
              Progressive levels from 200 → 900 WPM
            </li>
            <li className="flex items-center gap-2.5">
              <span className="landing-feature-card__bullet landing-feature-card__bullet--adult">
                <CheckIcon />
              </span>
              Short passages with comprehension checks
            </li>
            <li className="flex items-center gap-2.5">
              <span className="landing-feature-card__bullet landing-feature-card__bullet--adult">
                <CheckIcon />
              </span>
              Track XP, streaks, and personal bests
            </li>
          </ul>

          <span className="landing-feature-card__cta landing-feature-card__cta--adult">
            Continue Learning
            <span aria-hidden="true">&gt;</span>
          </span>
        </div>
      </Link>

      <Link
        href="/adventures"
        onClick={() => trackEvent('adventures_home_viewed', { source: 'landing' })}
        className="landing-feature-card landing-feature-card--kids group"
      >
        <div className="landing-feature-card__bg">
          <Image src="/kids_card.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="landing-feature-card__overlay landing-feature-card__overlay--kids" />
        </div>

        <div className="landing-feature-card__content">
          <div className="landing-feature-card__icon-ring landing-feature-card__icon-ring--kids">
            <Image src="/kids_icon.png" alt="" width={48} height={48} className="rounded-full" />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
            Reading Adventures
          </h3>
          <p className="mt-2 text-sm text-slate-200/90 leading-relaxed">
            Dive into story quests, make choices, and unlock new chapters.
          </p>

          <ul className="mt-4 space-y-2.5 text-sm text-slate-100">
            <li className="flex items-center gap-2.5">
              <span className="landing-feature-card__bullet landing-feature-card__bullet--kids">
                <BookIcon />
              </span>
              Engaging story quests
            </li>
            <li className="flex items-center gap-2.5">
              <span className="landing-feature-card__bullet landing-feature-card__bullet--kids">
                <StarIcon />
              </span>
              Earn rewards and collect clues
            </li>
            <li className="flex items-center gap-2.5">
              <span className="landing-feature-card__bullet landing-feature-card__bullet--kids">
                <DiamondIcon />
              </span>
              Fun for ages 8–14
            </li>
          </ul>

          <span className="landing-feature-card__cta landing-feature-card__cta--kids">
            Start an Adventure
            <span aria-hidden="true">&gt;</span>
          </span>
        </div>
      </Link>
    </div>
  );
}
