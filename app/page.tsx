'use client';

import { useReadingStore } from '@/lib/store';
import ContentInput from '@/components/ContentInput';
import ReadingView from '@/components/ReadingView';
import PageView from '@/components/PageView';
import ViralTestResults from '@/components/ViralTestResults';

export default function Home() {
  const viewMode = useReadingStore((state) => state.viewMode);
  const hasContent = useReadingStore((state) => state.processedWords.length > 0);
  const viralTestResults = useReadingStore((state) => state.viralTestResults);

  return (
    <>
      {/* Always render ContentInput - it will hide itself when content is loaded */}
      <ContentInput />
      
      {/* Show reading view or page view based on mode when content is loaded */}
      {hasContent && !viralTestResults && (
        viewMode === 'reading' ? <ReadingView /> : <PageView />
      )}

      {viralTestResults && <ViralTestResults />}
    </>
  );
}

