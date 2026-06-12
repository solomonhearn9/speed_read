'use client';

import { useState, useRef, useEffect } from 'react';
import { useReadingStore } from '@/lib/store';
import { parseFile, scrapeURL } from '@/lib/contentParsers';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';
import { countWords, truncateToWordLimit } from '@/lib/wordCount';
import { incrementAnonSessionCount } from '@/lib/anonSessions';
import { canStartViralTest, getViralTestAttemptCount, incrementViralTestAttemptCount } from '@/lib/viralTestAttempts';
import { isPaidProfile } from '@/lib/plans';
import type { Profile } from '@/lib/types';
import AuthHeader from './AuthHeader';
import LandingFeatureCards from './LandingFeatureCards';
import WordLimitBanner from './WordLimitBanner';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

const DEMO_TEXT = `Let's see if you can keep up with this Speed Reading exercise. We'll kick things off at 300 WPM. The average person reads 200 to 240 words per minute, so let's see if you can beat that.
The main trick with this kind of speed reading is quieting the voice in your head. This voice reads every single word out loud. That's the main habit that slows us all down. It's like taking training wheels off a bike. At first it feels strange, but soon you find your balance.
Right now, you're reading at 300 words per minute. Notice how your eyes aren't moving left to right anymore. They're locked on that red dot in the center. Your peripheral vision is doing all the heavy lifting.
This technique is called Rapid Serial Visual Presentation. It was developed by researchers who discovered something fascinating. Your eyes spend most of your reading time jumping from word to word. Not actually reading.
Those tiny movements are called saccades. They take up nearly half your reading time. By eliminating them, you instantly double your speed without losing comprehension.
Now here's where it gets interesting. Let's bump you up to 400 words per minute.

Feel that? You're now reading twice as fast as average. And you're understanding everything. Your brain is processing complete thoughts, not individual words.
The red character you see in each word isn't random. It's positioned at the Optimal Recognition Point. This is where your eye naturally wants to fixate to recognize a word fastest.
For short words, it's near the beginning. For longer words, it's slightly off-center. This is based on decades of eye-tracking research.
Let's push it further. We're going to 500 words per minute.

You're now in the top 10% of readers. Most people never experience reading at this speed. But here you are, comprehending everything.
Notice something else. You're not getting tired. Traditional reading strains your eye muscles with constant movement. This method keeps your eyes relaxed and stationary.
Some people worry they'll miss details at higher speeds. But studies show the opposite. When you read faster, you actually stay more focused. Your mind doesn't have time to wander.
Think about the last book you read. How many times did you reach the bottom of a page and realize you weren't paying attention? You had to reread entire paragraphs.
That doesn't happen here. Every word demands your attention for just a fraction of a second. Then it's gone. Your brain stays locked in.
wild? Let's try 600 words per minute.

You're now reading a full-length novel in under three hours. The average reader takes eight to ten hours. Imagine what you could do with that time back.
You could read fifty books a year instead of twelve. You could process work emails in minutes instead of hours. You could finally tackle that stack of articles you've been meaning to get to.
But speed isn't the only benefit. Many people report better retention with this method. Because you're fully engaged, the information actually sticks.
Traditional reading lets your mind drift. You might pronounce every word correctly but remember nothing. Active reading forces presence.
Let's take it up one more notch. 700 words per minute.

This is three times faster than your old reading speed. You're processing seven thousand words in just ten minutes. That's an entire magazine article.
At this pace, you could read the entire Harry Potter series in a weekend. War and Peace in two days. The complete works of Shakespeare in a week.
But more importantly, you could stay on top of everything competing for your attention. The reports. The research papers. The newsletters. The books everyone's talking about.
Information overload isn't a problem when you can process information three times faster.
Now here's the question. Can you go even faster? Some people max out around 600 WPM. Others push past 1000. There's only one way to find out.
Before we finish, let's drop back down to 300 WPM where we started.

Notice how slow this feels now? This is the speed you thought was fast five minutes ago. Your brain has already adapted. It's craving more.
That's the beautiful thing about speed reading. Once you experience it, normal reading feels like walking through mud.
You've just read about 850 words in roughly three minutes. At your old speed, this would have taken over six minutes. You just saved yourself three minutes.
Multiply that across everything you read in a day. Then a week. Then a year. You're looking at dozens of hours reclaimed.
So here's what happens next. You can upload any PDF, paste any article, or enter any URL. We'll transform it into this speed reading format.
Adjust the speed to your comfort level. Start slow and work your way up. Take breaks when you need them. Return to full-text view anytime.
Your brain is capable of incredible things. You just proved it. The only question is: what are you going to read first?
Welcome to the future of reading.`;

export default function ContentInput() {
  const { setText, play, setSpeed, startViralTest } = useReadingStore();
  const { usage, user, refreshUsage, refreshProfile } = useAuth();
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'file' | 'url'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordLimitMessage, setWordLimitMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'pricing' | 'upload' | 'url' | 'word_limit' | 'session_limit' | 'challenge_limit'>('pricing');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFirstVisitRef = useRef(false);
  const pasteTrackedRef = useRef(false);

  const dismissAuthNotice = () => setAuthNotice(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      trackEvent('checkout_completed');

      const pollForPaidProfile = async () => {
        for (let attempt = 0; attempt < 8; attempt++) {
          try {
            const res = await fetch('/api/usage');
            if (res.ok) {
              const data = await res.json();
              if (data.profile && isPaidProfile(data.profile as Profile)) {
                const profile = data.profile as Profile;
                const checkoutType = profile.plan_status === 'lifetime' ? 'lifetime' : 'monthly';
                trackEvent('paid_user_created', { checkout_type: checkoutType });
                await refreshUsage();
                return;
              }
            }
          } catch {
            // Non-blocking
          }
          if (attempt < 7) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        await refreshUsage();
      };

      void pollForPaidProfile();
      window.history.replaceState({}, '', '/');
    }
    if (params.get('auth') === 'verified') {
      trackEvent('verification_completed');
      refreshProfile();
      setAuthNotice('Email verified! You are now logged in.');
      window.history.replaceState({}, '', '/');
    }
    if (params.get('auth') === 'verification_failed') {
      setAuthNotice(
        'Email verification could not be completed. Try opening the link in the same browser where you signed up, or log in and resend the verification email.'
      );
      setShowAuthModal(true);
      window.history.replaceState({}, '', '/');
    }
  }, [refreshUsage, refreshProfile]);

  useEffect(() => {
    const sessionKey = 'speed-reader-landing-tracked';
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, '1');
    trackEvent('landing_page_view');
  }, []);

  useEffect(() => {
    const hasVisited = localStorage.getItem('speed-reader-visited');
    if (!hasVisited) {
      localStorage.setItem('speed-reader-visited', 'true');
    }
  }, []);

  const checkSessionLimit = (): boolean => {
    if (usage.isUnlimited) return true;

    if (usage.tier === 'anonymous' && usage.sessionsUsed >= usage.sessionsLimit) {
      trackEvent('session_limit_hit');
      setShowAuthModal(true);
      return false;
    }

    if (usage.tier === 'free' && usage.sessionsUsed >= usage.sessionsLimit) {
      trackEvent('session_limit_hit');
      setUpgradeReason('session_limit');
      setShowUpgradeModal(true);
      return false;
    }

    return true;
  };

  const recordSession = async (): Promise<boolean> => {
    if (usage.isUnlimited) return true;

    if (user) {
      const res = await fetch('/api/sessions/start', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'session_limit') {
          trackEvent('session_limit_hit');
          setUpgradeReason('session_limit');
          setShowUpgradeModal(true);
          return false;
        }
      }
      await refreshUsage();
      return res.ok;
    }

    incrementAnonSessionCount();
    await refreshUsage();
    return true;
  };

  const applyWordLimit = (text: string): string => {
    if (usage.isUnlimited) {
      setWordLimitMessage(null);
      return text;
    }

    const wordCount = countWords(text);
    if (wordCount <= usage.wordLimit) {
      setWordLimitMessage(null);
      return text;
    }

    trackEvent('word_limit_hit', { word_count: wordCount, wordCount, limit: usage.wordLimit });

    if (usage.tier === 'anonymous') {
      setWordLimitMessage(
        "You're reading the first 500 words. Sign up free to unlock 1,500 words/session or upgrade for unlimited."
      );
    } else {
      setWordLimitMessage(
        "You're reading the first 1,500 words. Upgrade for unlimited reading."
      );
    }

    return truncateToWordLimit(text, usage.wordLimit);
  };

  const startReading = async (text: string, isDemo = false) => {
    if (!text.trim()) return;

    dismissAuthNotice();
    trackEvent('start_reading_clicked');

    if (!checkSessionLimit()) return;

    const limitedText = applyWordLimit(text);
    const sessionRecorded = await recordSession();
    if (!sessionRecorded) return;

    const isDemoText = limitedText.trim().startsWith("Let's see if you can keep up with this Speed Reading exercise");
    setText(limitedText);
    setError(null);
    trackEvent('reading_session_started', { word_count: countWords(limitedText), wordCount: countWords(limitedText) });

    if ((isDemoText && isFirstVisitRef.current) || isDemo) {
      setTimeout(() => {
        setSpeed(300);
        play();
      }, 100);
    }
  };

  const handleViralTest = () => {
    dismissAuthNotice();

    if (!canStartViralTest(usage.isUnlimited)) {
      trackEvent('challenge_limit_hit');
      setUpgradeReason('challenge_limit');
      setShowUpgradeModal(true);
      return;
    }

    incrementViralTestAttemptCount();
    const challengeLevel = getViralTestAttemptCount();
    trackEvent('challenge_started', { challenge_level: challengeLevel });
    trackEvent('viral_test_started', { challenge_level: challengeLevel });
    startViralTest();
    setError(null);
    setTimeout(() => play(), 100);
  };

  const handleTextSubmit = () => {
    startReading(textInput);
  };

  const handleClearText = () => {
    setTextInput('');
    setWordLimitMessage(null);
    textareaRef.current?.focus();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      textareaRef.current?.select();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dismissAuthNotice();
    setTextInput(e.target.value);
    if (!pasteTrackedRef.current && e.target.value.length > 0) {
      pasteTrackedRef.current = true;
      trackEvent('paste_text_started');
    }
  };

  const handleTabSwitch = (method: 'text' | 'file' | 'url') => {
    dismissAuthNotice();
    if (method === 'file' && !usage.canUpload) {
      trackEvent('upload_gate_viewed');
      setUpgradeReason('upload');
      setShowUpgradeModal(true);
      return;
    }
    if (method === 'url' && !usage.canScrape) {
      trackEvent('url_gate_viewed');
      setUpgradeReason('url');
      setShowUpgradeModal(true);
      return;
    }
    setInputMethod(method);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    trackEvent('file_upload_attempted');

    if (!usage.canUpload) {
      trackEvent('upload_gate_viewed');
      setUpgradeReason('upload');
      setShowUpgradeModal(true);
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await parseFile(file);
      await startReading(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleURLSubmit = async () => {
    trackEvent('url_scrape_attempted');

    if (!usage.canScrape) {
      trackEvent('url_gate_viewed');
      setUpgradeReason('url');
      setShowUpgradeModal(true);
      return;
    }

    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await scrapeURL(urlInput);
      setUrlInput('');
      await startReading(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape URL');
    } finally {
      setIsLoading(false);
    }
  };

  const hasContent = useReadingStore((state) => state.processedWords.length > 0);
  const landingInputMethod = useReadingStore((state) => state.landingInputMethod);
  const clearLandingInputMethod = useReadingStore((state) => state.clearLandingInputMethod);

  useEffect(() => {
    if (hasContent || !landingInputMethod) return;

    if (landingInputMethod === 'file' && !usage.canUpload) {
      trackEvent('upload_gate_viewed');
      setUpgradeReason('upload');
      setShowUpgradeModal(true);
    }

    setInputMethod(landingInputMethod);
    if (landingInputMethod === 'text') {
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
    clearLandingInputMethod();
  }, [hasContent, landingInputMethod, usage.canUpload, clearLandingInputMethod]);

  if (hasContent) {
    return (
      <>
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason={upgradeReason}
          theme="challenge"
          onRequireAuth={() => {
            setShowUpgradeModal(false);
            setShowAuthModal(true);
          }}
        />
      </>
    );
  }

  return (
    <div data-theme="challenge" className="challenge-screen w-full text-slate-100 relative overflow-x-hidden">
      <div className="absolute inset-0 challenge-glow pointer-events-none" aria-hidden="true" />
      <AuthHeader theme="challenge" />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
        <section className="max-w-3xl mx-auto pt-6 sm:pt-8 md:pt-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-3 sm:mb-4 leading-tight tracking-tight">
            How <span className="challenge-hero-accent">fast</span> can you read?
          </h1>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Take the 30-second reading challenge and discover your WPM score.
          </p>

          <div className="mt-6 sm:mt-8">
            <button
              onClick={handleViralTest}
              className="w-full max-w-xl mx-auto px-6 py-3.5 sm:py-4 btn-challenge text-base md:text-lg"
            >
              Start the 30-Second Challenge
            </button>
            <p className="mt-3 text-center text-[10px] sm:text-xs challenge-text-muted">
              Average reader ≈ 200 WPM
            </p>
            <p className="mt-1.5 text-center text-[10px] sm:text-xs challenge-text-muted leading-relaxed">
              <span className="inline-flex flex-wrap justify-center gap-x-2 gap-y-1.5">
                <span>🟢 300 WPM</span>
                <span className="text-slate-600 hidden sm:inline" aria-hidden="true">•</span>
                <span>🟡 500 WPM</span>
                <span className="text-slate-600 hidden sm:inline" aria-hidden="true">•</span>
                <span>🔴 700 WPM</span>
                <span className="text-slate-600 hidden sm:inline" aria-hidden="true">•</span>
                <span>⚫ 900+ WPM</span>
              </span>
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mt-8 sm:mt-10 w-full">
          <LandingFeatureCards />
        </section>

        <section className="max-w-3xl mx-auto mt-10 sm:mt-12 w-full">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="challenge-divider" />
          <span className="text-xs sm:text-sm challenge-text-muted whitespace-nowrap">or paste your own text</span>
          <div className="challenge-divider" />
        </div>

        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleTabSwitch('text')}
            className={`shrink-0 px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
              inputMethod === 'text'
                ? 'text-white border-b-2 border-challenge-cta'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => handleTabSwitch('file')}
            className={`shrink-0 px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
              inputMethod === 'file'
                ? 'text-white border-b-2 border-challenge-cta'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => handleTabSwitch('url')}
            className={`shrink-0 px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
              inputMethod === 'url'
                ? 'text-white border-b-2 border-challenge-cta'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            URL Scrape
          </button>
        </div>

        {authNotice && (
          <div className={`mb-4 p-4 rounded-lg text-sm ${
            authNotice.includes('verified')
              ? 'bg-green-900/30 border border-green-500 text-green-300'
              : 'bg-amber-900/30 border border-amber-500 text-amber-200'
          }`}>
            {authNotice}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {wordLimitMessage && (
          <WordLimitBanner
            message={wordLimitMessage}
            onUpgrade={() => {
              setUpgradeReason('word_limit');
              setShowUpgradeModal(true);
            }}
          />
        )}

        {inputMethod === 'text' && (
          <div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Paste your text here..."
                className="w-full h-64 challenge-input resize-none select-text"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              {textInput && (
                <button
                  onClick={handleClearText}
                  className="absolute top-2 right-2 px-3 py-1 text-sm challenge-btn-secondary"
                  title="Clear text"
                >
                  Clear
                </button>
              )}
            </div>
            {!usage.isUnlimited && (
              <p className="mt-2 text-xs challenge-text-muted text-center">
                {usage.tier === 'anonymous'
                  ? 'Free: paste up to 500 words. Upgrade for unlimited reading, uploads, and URL scraping.'
                  : 'Free: paste up to 1,500 words. Upgrade for unlimited reading, uploads, and URL scraping.'}
              </p>
            )}
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="mt-4 w-full px-6 py-3 btn-challenge disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-medium"
            >
              Start Reading
            </button>
          </div>
        )}

        {inputMethod === 'file' && (
          <div>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 sm:p-10 md:p-12 text-center hover:border-brand-cyan/30 transition-colors challenge-surface">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
                onClick={(e) => {
                  if (!usage.canUpload) {
                    e.preventDefault();
                    trackEvent('upload_gate_viewed');
                    setUpgradeReason('upload');
                    setShowUpgradeModal(true);
                  }
                }}
              >
                <svg
                  className="w-16 h-16 text-slate-500 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-lg font-medium mb-2">
                  {isLoading ? 'Processing...' : 'Click to upload or drag and drop'}
                </span>
                <span className="text-sm challenge-text-muted">
                  Supports PDF, DOCX, DOC, TXT files — Pro feature
                </span>
              </label>
            </div>
          </div>
        )}

        {inputMethod === 'url' && (
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              className="challenge-input mb-4"
            />
            <button
              onClick={handleURLSubmit}
              disabled={!urlInput.trim() || isLoading}
              className="w-full px-6 py-3 btn-challenge disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Scraping...' : 'Scrape and Read'}
            </button>
          </div>
        )}

        <div className="mt-10 sm:mt-12 p-4 sm:p-6 challenge-surface rounded-xl">
          <h2 className="text-lg sm:text-xl font-bold mb-4">How it works</h2>
          <ul className="space-y-2.5 text-sm sm:text-base challenge-text-muted">
            <li>• Words appear one at a time in the center of the screen</li>
            <li>• The red anchor character helps your eyes focus</li>
            <li>• Adjust speed with the slider (100-1000 WPM)</li>
            <li>• Press Space to play/pause</li>
            <li>• Use arrow keys to navigate sentences</li>
            <li>• Press ESC or click &quot;Full Text View&quot; to see the full document</li>
          </ul>
        </div>
        </section>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signup"
        theme="challenge"
      />

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
        theme="challenge"
        onRequireAuth={() => {
          setShowUpgradeModal(false);
          setShowAuthModal(true);
        }}
      />
    </div>
  );
}
