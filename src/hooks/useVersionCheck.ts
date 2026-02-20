import { useEffect, useRef } from 'react';

/**
 * Interval between automatic version checks (5 minutes).
 * A visibility-change check also fires when the user returns to the tab.
 */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * The version string baked into this bundle at build time.
 * In dev mode (or before the first production build) it will be `undefined`.
 */
const BUNDLED_VERSION: string | undefined = import.meta.env.VITE_APP_VERSION;

/**
 * Fetches /version.json (cache-busted) and returns the version string the
 * server is currently serving, or `null` if the fetch fails for any reason.
 */
async function fetchServerVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.version ?? null;
  } catch {
    return null; // offline / network error – don't force a reload
  }
}

/**
 * Unregisters every active service worker so the next page load starts fresh.
 */
async function unregisterAllServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}

/**
 * Hook that periodically checks whether a newer version of the app has been
 * deployed.  When a mismatch is detected it:
 *   1. Unregisters all service workers (so they can't serve stale assets)
 *   2. Hard-reloads the page
 *
 * Checks happen:
 *   • Every 5 minutes while the tab is open
 *   • Immediately when the tab becomes visible again (e.g. user switches back)
 *
 * In development (`BUNDLED_VERSION` is undefined) the hook is a no-op.
 */
export function useVersionCheck(): void {
  const hasReloaded = useRef(false);

  useEffect(() => {
    // Skip in development – no version.json exists
    if (!BUNDLED_VERSION) return;

    const check = async () => {
      // Guard against triggering multiple reloads
      if (hasReloaded.current) return;

      const serverVersion = await fetchServerVersion();
      if (!serverVersion) return; // fetch failed – try again later

      if (serverVersion !== BUNDLED_VERSION) {
        hasReloaded.current = true;
        console.log(
          `[version-check] New version detected (bundled: ${BUNDLED_VERSION}, server: ${serverVersion}). Reloading...`
        );
        await unregisterAllServiceWorkers();
        window.location.reload();
      }
    };

    // Run an initial check shortly after mount (give the app a moment to settle)
    const initialTimeout = setTimeout(check, 5_000);

    // Periodic check
    const interval = setInterval(check, CHECK_INTERVAL_MS);

    // Visibility change – check when the user returns to the tab
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        check();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
}
