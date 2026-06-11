import { trackEvent } from './index';

/** Wire these when the referral UI ships. No referral functionality yet. */

export function trackInviteModalViewed(): void {
  trackEvent('invite_modal_viewed');
}

export function trackInviteSent(properties?: Record<string, unknown>): void {
  trackEvent('invite_sent', properties);
}

export function trackReferralLinkCopied(): void {
  trackEvent('referral_link_copied');
}
