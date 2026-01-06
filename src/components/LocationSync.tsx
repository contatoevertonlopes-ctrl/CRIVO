import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function getBrowserPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function LocationSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const patchedRef = useRef(false);
  const isSyncingRef = useRef(false);
  const lastSyncedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (patchedRef.current) return;
    patchedRef.current = true;

    const dispatchLocationChange = () => {
      window.dispatchEvent(new Event("locationchange"));
    };

    const originalPushState = window.history.pushState;

    window.history.pushState = function (...args: Parameters<History["pushState"]>) {
      const result = originalPushState.apply(this, args);
      dispatchLocationChange();
      return result;
    };

    const onPopState = () => dispatchLocationChange();
    window.addEventListener("popstate", onPopState);

    return () => {
      window.history.pushState = originalPushState;
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    const onLocationChange = () => {
      if (isSyncingRef.current) return;

      const browserPath = getBrowserPath();
      const routerPath = `${location.pathname}${location.search}${location.hash}`;

      // Evita loops se algo ficar disparando locationchange sem mudar a URL.
      if (lastSyncedPathRef.current === browserPath) return;

      if (browserPath !== routerPath) {
        isSyncingRef.current = true;
        lastSyncedPathRef.current = browserPath;
        navigate(browserPath, { replace: true });

        // Libera no próximo tick para não recursar.
        window.setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    };

    window.addEventListener("locationchange", onLocationChange);
    return () => window.removeEventListener("locationchange", onLocationChange);
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}
