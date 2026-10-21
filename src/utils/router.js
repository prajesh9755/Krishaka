import { useEffect, useState } from 'react';

// Minimal URL routing on the History API: the URL path is the source of truth for
// which screen/page/tab is shown, so reload and the browser back button work.
const EVENT = 'krishaka:navigate';

export function navigate(path, { replace = false } = {}) {
  if (window.location.pathname !== path) {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
  }
  window.dispatchEvent(new Event(EVENT));
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener('popstate', update);
    window.addEventListener(EVENT, update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener(EVENT, update);
    };
  }, []);
  return path;
}
