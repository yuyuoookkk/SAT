import { useEffect, useRef } from 'react';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

/**
 * How often the browser says "still here".
 *
 * Must stay comfortably under `presence_window()` in migration 0012, which is
 * 60 seconds — this leaves room for two dropped requests.
 */
const BEAT_MS = 20_000;

/**
 * Marks the signed-in account as present while the site is open, which is what
 * the Aktif / Tidak Aktif column on "Akun Siswa" reads.
 *
 * Only while the tab is *visible*: a site left open in a background tab for two
 * days is not someone being on the site, and counting it would make the column
 * meaningless within a week.
 *
 * Every failure is swallowed. This is a nicety — if the migrations have not
 * been applied the RPCs do not exist, and an alumnus filling in a questionnaire
 * should never see an error about a heartbeat.
 */
export function usePresence(accessToken: string | undefined): void {
  // Read by the leave beacon, which fires at a moment too late to await
  // anything. Keeping the current token in a ref means it never has to.
  const token = useRef(accessToken);
  token.current = accessToken;

  useEffect(() => {
    if (!accessToken) return;

    let alive = true;

    const beat = async () => {
      if (!alive || document.visibilityState !== 'visible') return;
      try {
        await supabase.rpc('touch_presence');
      } catch {
        /* offline, or the migration is not applied — not the user's problem */
      }
    };

    /**
     * Backdates the heartbeat so the account reads as away at once, rather than
     * lingering until the window runs out.
     *
     * Sent as a bare fetch with `keepalive` on purpose: at `pagehide` the page
     * is being torn down and an ordinary request is cancelled with it, which is
     * exactly why closing a tab used to change nothing on the admin's screen.
     */
    const leave = () => {
      const jwt = token.current;
      if (!jwt) return;
      try {
        void fetch(`${SUPABASE_URL}/rest/v1/rpc/end_presence`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${jwt}`,
          },
          body: '{}',
        }).catch(() => {});
      } catch {
        /* nothing useful to do while the page is closing */
      }
    };

    void beat();
    const timer = window.setInterval(() => void beat(), BEAT_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void beat();
      else leave();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', leave);

    return () => {
      alive = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', leave);
    };
  }, [accessToken]);
}
