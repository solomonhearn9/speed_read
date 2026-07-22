'use client';

import { useReadingStore } from '@/lib/store';
import ContentInput from '@/components/ContentInput';
import ReadingView from '@/components/ReadingView';
import PageView from '@/components/PageView';
import ViralTestQuiz from '@/components/ViralTestQuiz';
import ViralTestResults from '@/components/ViralTestResults';

export default function Home() {
  const viewMode = useReadingStore((state) => state.viewMode);
  const hasContent = useReadingStore((state) => state.processedWords.length > 0);
  const viralChallengePhase = useReadingStore((state) => state.viralChallengePhase);
  const viralTestResults = useReadingStore((state) => state.viralTestResults);

  const showReading =
    hasContent && viralChallengePhase === 'reading';
  const showQuiz = viralChallengePhase === 'quiz';
  const showResults = viralChallengePhase === 'results' && viralTestResults;

  return (
    <>
      <ContentInput />

      {showReading && (viewMode === 'reading' ? <ReadingView /> : <PageView />)}

      {showQuiz && <ViralTestQuiz />}
      {showResults && <ViralTestResults />}
    </>
  );
}
