/** Shared formatting helpers for the admin screens. */

const ID = 'id-ID';

export const formatNumber = (n: number): string => new Intl.NumberFormat(ID).format(n);

export const formatPercent = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/** "12 Okt 2023" — the table's first date line. */
export const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(ID, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(new Date(iso));
};

/** "14:20 WITA" — the table's second date line. Asia/Makassar is WITA. */
export const formatTimeWita = (iso: string | null): string => {
  if (!iso) return '';
  const t = new Intl.DateTimeFormat(ID, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar',
  }).format(new Date(iso));
  return `${t} WITA`;
};

/** "2 menit yang lalu" for the activity feed. */
export const timeAgo = (iso: string): string => {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, 'detik'],
    [3600, 'menit'],
    [86400, 'jam'],
    [2592000, 'hari'],
  ];
  if (secs < 60) return 'baru saja';
  for (let i = 1; i < steps.length; i++) {
    if (secs < steps[i][0]) {
      return `${Math.floor(secs / steps[i - 1][0])} ${steps[i][1]} yang lalu`;
    }
  }
  return `${Math.floor(secs / 2592000)} bulan yang lalu`;
};

/**
 * "I Wayan Sudarsana" → "WS" for the table avatars.
 *
 * Balinese names commonly open with an honorific / birth-order particle ("I",
 * "Ni", "Ida", "Sang"). Treating those as an initial made four different
 * alumni all render as "I·", so they are skipped when a real name follows.
 */
const HONORIFICS = new Set(['i', 'ni', 'ida', 'sang', 'anak', 'agung', 'dewa', 'cok']);

export const initials = (name: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';

  const meaningful = parts.filter((w) => !HONORIFICS.has(w.toLowerCase()));
  const use = meaningful.length >= 1 ? meaningful : parts;

  if (use.length === 1) return use[0].slice(0, 2).toUpperCase();
  return (use[0][0] + use[use.length - 1][0]).toUpperCase();
};

/** Deterministic avatar tint so a given alumnus keeps the same colour. */
const AVATAR_TINTS = ['#0b5ed7', '#a855f7', '#d73480', '#0f766e', '#b45309', '#4f46e5'];

export const avatarTint = (seed: string | null): string => {
  if (!seed) return AVATAR_TINTS[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
};
