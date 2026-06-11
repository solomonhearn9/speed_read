const STORAGE_KEY = 'speed-reader-first-touch-attribution';

export interface FirstTouchAttribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  referrer: string | null;
  landing_path: string | null;
  source_platform: string | null;
  content_id: string | null;
  captured_at: string;
}

function deriveSourcePlatform(utmSource: string | null): string | null {
  if (!utmSource) return null;
  const normalized = utmSource.toLowerCase();
  if (normalized.includes('tiktok') || normalized === 'tt') return 'tiktok';
  if (normalized.includes('instagram') || normalized === 'ig' || normalized === 'reels') return 'instagram';
  if (normalized.includes('youtube') || normalized === 'yt' || normalized.includes('shorts')) return 'youtube';
  if (normalized.includes('facebook') || normalized === 'fb') return 'facebook';
  if (normalized.includes('twitter') || normalized === 'x') return 'twitter';
  if (normalized.includes('linkedin')) return 'linkedin';
  return normalized;
}

export function getStoredAttribution(): FirstTouchAttribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FirstTouchAttribution;
  } catch {
    return null;
  }
}

export function captureFirstTouchAttribution(): FirstTouchAttribution | null {
  if (typeof window === 'undefined') return null;

  const existing = getStoredAttribution();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');

  const attribution: FirstTouchAttribution = {
    utm_source: utmSource,
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    referrer: document.referrer || null,
    landing_path: `${window.location.pathname}${window.location.search}`,
    source_platform: deriveSourcePlatform(utmSource),
    content_id: params.get('content_id') || params.get('utm_content'),
    captured_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Non-blocking
  }

  return attribution;
}

export function getAttributionProperties(): Record<string, string | null> {
  const attribution = getStoredAttribution();
  if (!attribution) {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      referrer: null,
      landing_path: null,
      source_platform: null,
      content_id: null,
    };
  }

  return {
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    referrer: attribution.referrer,
    landing_path: attribution.landing_path,
    source_platform: attribution.source_platform,
    content_id: attribution.content_id,
  };
}

export function getAttributionProfilePayload(): Record<string, string | null> {
  const attribution = getStoredAttribution();
  if (!attribution) {
    return {
      first_utm_source: null,
      first_utm_medium: null,
      first_utm_campaign: null,
      first_utm_content: null,
      first_referrer: null,
      first_landing_path: null,
    };
  }

  return {
    first_utm_source: attribution.utm_source,
    first_utm_medium: attribution.utm_medium,
    first_utm_campaign: attribution.utm_campaign,
    first_utm_content: attribution.utm_content,
    first_referrer: attribution.referrer,
    first_landing_path: attribution.landing_path,
  };
}
