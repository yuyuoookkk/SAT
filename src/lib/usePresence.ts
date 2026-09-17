import { useEffect } from 'react';
import { supabase } from './supabase';

/**
 * How often the browser says "still here".
 *
 * Must stay comfortably under `presence_window()` in migration 0010, which is
 * two minutes — otherwise one dropped request blinks the alumnus offline.
 */
const BEAT_MS = 45_000;

/**
 * Marks the signed-in account as present while the site is open, which is what
 * the Aktif / Tidak Aktif column on "Akun Siswa" now reads.
 *
 * Only while the tab is *visible*: a site left open in a background tab for two
 * days is not someone being on the site, and counting it would make the column
 * meaningless within a week.
 *
 * Every failure is swallowed. This is a nicety — if migration 0010 has not been
 * applied the RPC does not exist, and an alumnus filling in a questionnaire
 * should never see an error about a heartbeat.
 */
export function usePresence(userId: string | undefined): void {
  useEffect(() => {
    if (!userId) return;

    let alive = true;

    const beat = async () => {
      if (!alive || document.visibilityState !== 'visible') return;
      try {
        await supabase.rpc('touch_presence');
      } catch {
        /* offline, or 0010 not applied — neither is the user's problem */
      }
    };

    void beat();
    const timer = window.setInterval(() => void beat(), BEAT_MS);

    // Coming back to the tab should show as present immediately, rather than
    // up to 45 seconds later.
    const onVisibility = () => void beat();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [userId]);
}
