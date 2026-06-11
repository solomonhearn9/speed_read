import { getAttributionProfilePayload } from './attribution';

export async function persistSignupAttribution(): Promise<void> {
  const payload = getAttributionProfilePayload();
  const hasData = Object.values(payload).some((value) => value !== null);
  if (!hasData) return;

  try {
    await fetch('/api/analytics/attribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-blocking
  }
}
