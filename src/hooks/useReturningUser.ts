import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'clmp-has-account';

/**
 * Mark the current browser as belonging to a returning user.
 * Call this after a successful sign-in / sign-up so that future
 * visits to the landing page can show "Login" instead of "Start Free Trial".
 */
export function markReturningUser(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Private browsing / storage full – silently ignore
  }
}

/**
 * Returns `true` if this browser has ever had a successful sign-in,
 * meaning the user should see "Login" rather than "Start Free Trial"
 * on the landing page.
 *
 * Uses `useSyncExternalStore` for a render-safe localStorage read that
 * avoids hydration mismatches and responds to cross-tab changes.
 */
export function useReturningUser(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

// SSR fallback – always treat as new user on the server
function getServerSnapshot(): boolean {
  return false;
}

function subscribe(callback: () => void): () => void {
  // Listen for changes from other tabs
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
