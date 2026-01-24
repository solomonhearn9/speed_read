'use client';

import { useState, useRef, useEffect } from 'react';
import { useReadingStore } from '@/lib/store';
import { parseFile, scrapeURL } from '@/lib/contentParsers';

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
  const { setText, viewMode, play, setSpeed } = useReadingStore();
  const [inputMethod, setInputMethod] = useState<'text' | 'file' | 'url'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFirstVisitRef = useRef(false);

  // Check for first-time visitor and load demo
  useEffect(() => {
    const hasVisited = localStorage.getItem('speed-reader-visited');
    if (!hasVisited) {
      setTextInput(DEMO_TEXT);
      isFirstVisitRef.current = true;
      localStorage.setItem('speed-reader-visited', 'true');
    }
  }, []);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      const isDemoText = textInput.trim().startsWith("Let's see if you can keep up with this Speed Reading exercise");
      setText(textInput);
      setError(null);
      
      // Auto-start demo for first-time visitors
      if (isDemoText && isFirstVisitRef.current) {
        setTimeout(() => {
          setSpeed(300);
          play();
        }, 100);
      }
    }
  };

  const handleClearText = () => {
    setTextInput('');
    textareaRef.current?.focus();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Cmd/Ctrl+A for select all
    if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
      e.preventDefault();
      textareaRef.current?.select();
    }
    // Allow Cmd/Ctrl+C for copy
    // Allow Cmd/Ctrl+V for paste
    // Allow Cmd/Ctrl+X for cut
    // These are handled by default browser behavior, no need to prevent
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const text = await parseFile(file);
      setText(text);
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
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await scrapeURL(urlInput);
      setText(text);
      setUrlInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape URL');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show input if we have content loaded
  const hasContent = useReadingStore((state) => state.processedWords.length > 0);
  if (hasContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto px-4 md:px-0">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Speed Reader</h1>
          <p className="text-gray-400 text-sm md:text-lg">
            Rapid Serial Visual Presentation with Optimal Recognition Point
          </p>
        </div>

        {/* Input method tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => setInputMethod('text')}
            className={`px-4 py-2 font-medium transition-colors ${
              inputMethod === 'text'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setInputMethod('file')}
            className={`px-4 py-2 font-medium transition-colors ${
              inputMethod === 'file'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setInputMethod('url')}
            className={`px-4 py-2 font-medium transition-colors ${
              inputMethod === 'url'
                ? 'text-white border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            URL Scrape
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Text input */}
        {inputMethod === 'text' && (
          <div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Paste your text here..."
                className="w-full h-64 bg-gray-900 border border-gray-800 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none select-text text-sm md:text-base"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
              />
              {textInput && (
                <button
                  onClick={handleClearText}
                  className="absolute top-2 right-2 px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                  title="Clear text"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
              className="mt-4 w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              Start Reading
            </button>
          </div>
        )}

        {/* File upload */}
        {inputMethod === 'file' && (
          <div>
            <div className="border-2 border-dashed border-gray-800 rounded-lg p-12 text-center hover:border-gray-700 transition-colors">
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
              >
                <svg
                  className="w-16 h-16 text-gray-600 mb-4"
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
                <span className="text-sm text-gray-500">
                  Supports PDF, DOCX, DOC, TXT files
                </span>
              </label>
            </div>
          </div>
        )}

        {/* URL input */}
        {inputMethod === 'url' && (
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full bg-gray-900 border border-gray-800 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4 text-sm md:text-base"
            />
            <button
              onClick={handleURLSubmit}
              disabled={!urlInput.trim() || isLoading}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? 'Scraping...' : 'Scrape and Read'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ul className="space-y-2 text-gray-400">
            <li>• Words appear one at a time in the center of the screen</li>
            <li>• The red anchor character helps your eyes focus</li>
            <li>• Adjust speed with the slider (100-1000 WPM)</li>
            <li>• Press Space to play/pause</li>
            <li>• Use arrow keys to navigate sentences</li>
            <li>• Press ESC or click &quot;Full Text View&quot; to see the full document</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

