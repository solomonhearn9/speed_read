'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { MapConfig, MapLayout } from '@/lib/maps/mapConfigs';
import { getLockedNodeLabel, type AccessTier } from '@/lib/accessTier';
import './map-theme.css';

/* ── Public types ───────────────────────────────────────────────────────── */

export type MapNodeStatus =
  | 'locked'
  | 'unlocked'
  | 'current'
  | 'completed'
  | 'mastered'
  | 'coming-soon';

export interface MapNodeData {
  /** Must match a node id in the map config (e.g. 'adult-1'). */
  id: string;
  levelNumber: number;
  title: string;
  description: string;
  region: string;
  targetWpm: number | null;
  xpReward: number | null;
  status: MapNodeStatus;
  accessTier?: AccessTier;
  /** Route to start/replay the level; null when not playable. */
  href: string | null;
  /** 0–3 stars shown above completed nodes. */
  stars: number;
  bestWpm?: number | null;
}

export interface MapStatToken {
  id: string;
  icon: string;
  value: string;
  label: string;
}

export interface MapGuestBanner {
  headline: string;
  detail: string;
}

interface MapProgressScreenProps {
  config: MapConfig;
  nodes: MapNodeData[];
  stats: MapStatToken[];
  backHref?: string;
  guestBanner?: MapGuestBanner | null;
  onGuestSignup?: () => void;
  onSubscriptionGate?: () => void;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

function useBreakpoint(): 'mobile' | 'desktop' | null {
  const [bp, setBp] = useState<'mobile' | 'desktop' | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setBp(mq.matches ? 'desktop' : 'mobile');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return bp;
}

interface Point {
  x: number;
  y: number;
}

/** Smooth polyline through the node points (quadratic curves via midpoints). */
function buildPathD(points: Point[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x} ${points[i].y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

const STATUS_LABEL: Record<MapNodeStatus, string> = {
  locked: 'Locked',
  'coming-soon': 'Coming soon',
  unlocked: 'Unlocked',
  current: 'Up next',
  completed: 'Completed',
  mastered: 'Mastered',
};

function LockIcon() {
  return (
    <svg
      className="map-node-lock-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ── Component ──────────────────────────────────────────────────────────── */

export default function MapProgressScreen({
  config,
  nodes,
  stats,
  backHref = '/',
  guestBanner,
  onGuestSignup,
  onSubscriptionGate,
}: MapProgressScreenProps) {
  const breakpoint = useBreakpoint();
  const [selected, setSelected] = useState<MapNodeData | null>(null);
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout: MapLayout | null = breakpoint ? config.layouts[breakpoint] : null;

  const nodeById = useMemo(() => {
    const m = new Map<string, MapNodeData>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  // SVG geometry: width fixed at 100 units, height derived from the image
  // aspect ratio so curves and dashes are not distorted.
  const viewH = layout ? 100 / layout.aspectRatio : 100;
  const points: Point[] = useMemo(() => {
    if (!layout) return [];
    return layout.nodes
      .filter((c) => nodeById.has(c.id))
      .map((c) => ({ x: c.x, y: (c.y / 100) * viewH }));
  }, [layout, nodeById, viewH]);

  const currentIndex = useMemo(() => {
    if (!layout) return -1;
    return layout.nodes.findIndex((c) => nodeById.get(c.id)?.status === 'current');
  }, [layout, nodeById]);

  // Mobile: start scrolled near the player's current node.
  useEffect(() => {
    if (breakpoint !== 'mobile' || !layout || !mapRef.current) return;
    const coord =
      currentIndex >= 0 ? layout.nodes[currentIndex] : layout.nodes[layout.nodes.length - 1];
    if (!coord) return;
    const rect = mapRef.current.getBoundingClientRect();
    const nodeY = rect.top + window.scrollY + rect.height * (coord.y / 100);
    window.scrollTo({ top: Math.max(0, nodeY - window.innerHeight / 2), behavior: 'auto' });
  }, [breakpoint, layout, currentIndex]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const handleNodeTap = (node: MapNodeData) => {
    if (node.status === 'locked' || node.status === 'coming-soon') {
      if (node.status === 'locked') {
        const tier = node.accessTier;
        if (tier === 'signup' && onGuestSignup) {
          onGuestSignup();
          return;
        }
        if (tier === 'subscription' && onSubscriptionGate) {
          onSubscriptionGate();
          return;
        }
      }
      const msg =
        node.status === 'coming-soon'
          ? 'This level is coming soon!'
          : node.accessTier
            ? getLockedNodeLabel(node.accessTier)
            : `Complete ${node.levelNumber === 1 ? 'the previous step' : `Level ${node.levelNumber - 1}`} to unlock this one.`;
      setLockedToast(msg);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setLockedToast(null), 2400);
      return;
    }
    setSelected(node);
  };

  const ctaLabel = (node: MapNodeData) =>
    node.status === 'completed' || node.status === 'mastered' ? 'Replay' : 'Start';

  return (
    <div className={`map-screen map-theme-${config.theme}`}>
      {/* ── Sticky top status bar ── */}
      <header className="sticky top-0 z-40 map-glass">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <Link
            href={backHref}
            aria-label="Back"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="map-title-gradient text-base md:text-xl font-extrabold tracking-tight truncate">
              {config.title}
            </h1>
            <p className="hidden md:block text-xs text-slate-400 truncate">{config.subtitle}</p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto">
            {stats.map((s) => (
              <span key={s.id} className="map-token" title={s.label}>
                <span aria-hidden="true">{s.icon}</span>
                <span className="tabular-nums">{s.value}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Map panel ── */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-8">
        {guestBanner && (
          <div className="map-guest-banner mb-3 md:mb-4">
            <span className="map-guest-banner-icon" aria-hidden="true">
              ✦
            </span>
            <div className="map-guest-banner-copy">
              <p className="map-guest-banner-headline">{guestBanner.headline}</p>
              <p className="map-guest-banner-detail">{guestBanner.detail}</p>
            </div>
            {onGuestSignup && (
              <button type="button" className="map-guest-banner-cta" onClick={onGuestSignup}>
                Sign up
              </button>
            )}
          </div>
        )}

        <div className="map-frame">
          {!layout ? (
            <div className="h-[60vh] flex items-center justify-center text-slate-500 text-sm">
              Loading map...
            </div>
          ) : (
            <div
              ref={mapRef}
              className="relative w-full select-none"
              style={{ aspectRatio: `${layout.aspectRatio}` }}
            >
              <Image
                src={layout.image}
                alt={`${config.title} map`}
                fill
                priority
                sizes="(min-width: 768px) 1100px, 100vw"
                className="object-cover pointer-events-none"
              />

              {/* edge vignette — keeps labels/nodes readable over busy art */}
              <div className="map-vignette pointer-events-none" aria-hidden="true" />

              {/* soft progress glow along completed segments */}
              {points.length >= 2 && currentIndex > 0 && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
                  viewBox={`0 0 100 ${viewH}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    className="map-path-progress"
                    d={buildPathD(points.slice(0, currentIndex + 1))}
                    strokeWidth={2.2}
                  />
                </svg>
              )}

              {/* region labels */}
              {layout.regionLabels.map((r) => (
                <div
                  key={r.label}
                  className="map-region-label"
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                >
                  <span className="map-region-marker" aria-hidden="true" />
                  <span>{r.label}</span>
                </div>
              ))}

              {/* level nodes */}
              {layout.nodes.map((coord) => {
                const node = nodeById.get(coord.id);
                if (!node) return null;
                const done = node.status === 'completed' || node.status === 'mastered';
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleNodeTap(node)}
                    className={`map-node map-node-${node.status}`}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    aria-label={`Level ${node.levelNumber}: ${node.title} (${STATUS_LABEL[node.status]})`}
                  >
                    {node.status === 'current' && <span className="map-node-pulse-ring" />}
                    {done && (
                      <span className="map-node-stars" aria-hidden="true">
                        {[1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={i <= node.stars ? 'map-node-star-on' : 'map-node-star-off'}
                          >
                            ★
                          </span>
                        ))}
                      </span>
                    )}
                    <span className="map-node-circle">
                      {node.status === 'locked' || node.status === 'coming-soon' ? (
                        <LockIcon />
                      ) : done ? (
                        <span aria-hidden="true" className="map-node-check">✓</span>
                      ) : (
                        node.levelNumber
                      )}
                    </span>
                    {node.status !== 'current' && (
                      <span className="map-node-label">
                        {node.status === 'coming-soon' ? 'Coming soon' : node.title}
                      </span>
                    )}
                    {node.status === 'current' && (
                      <span className="map-node-current-chip">
                        <span className="map-node-current-level">
                          {config.theme === 'kids' ? 'Ch.' : 'Lv.'} {node.levelNumber}
                        </span>
                        <span className="map-node-current-title">{node.title}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Bottom sheet (mobile) / modal (desktop) ── */}
      {selected && (
        <>
          <div className="map-sheet-backdrop" onClick={() => setSelected(null)} />
          <div
            className="map-sheet map-glass map-panel p-6 pb-8 md:pb-6"
            role="dialog"
            aria-modal="true"
            aria-label={`Level ${selected.levelNumber}: ${selected.title}`}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" />

            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">
                {config.theme === 'kids' ? 'Chapter' : 'Level'} {selected.levelNumber} ·{' '}
                {selected.region}
              </p>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="shrink-0 -mt-1 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-white mb-2">{selected.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{selected.description}</p>

            <div className="flex flex-wrap gap-2 mb-5">
              {selected.targetWpm != null && (
                <span className="map-token">
                  <span aria-hidden="true">⚡</span>
                  <span className="tabular-nums">{selected.targetWpm} WPM</span>
                </span>
              )}
              {selected.xpReward != null && (
                <span className="map-token">
                  <span aria-hidden="true">✦</span>
                  <span className="tabular-nums">+{selected.xpReward} XP</span>
                </span>
              )}
              {selected.bestWpm != null && (
                <span className="map-token">
                  <span aria-hidden="true">🏆</span>
                  <span className="tabular-nums">Best {selected.bestWpm} WPM</span>
                </span>
              )}
            </div>

            {selected.href ? (
              <Link href={selected.href} className="map-cta">
                {ctaLabel(selected)}{' '}
                {config.theme === 'kids' ? `Chapter ${selected.levelNumber}` : `Level ${selected.levelNumber}`}
              </Link>
            ) : (
              <p className="text-center text-sm text-slate-500">Not available yet.</p>
            )}
          </div>
        </>
      )}

      {/* ── Locked toast ── */}
      {lockedToast && (
        <div className="map-toast map-glass" role="status">
          <LockIcon />
          <span>{lockedToast}</span>
        </div>
      )}
    </div>
  );
}
