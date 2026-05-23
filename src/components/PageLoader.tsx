import { useState, useEffect } from "react";

/**
 * Suspense fallback for lazy-loaded pages.
 * Delays 200ms before appearing to avoid flashing on fast navigations.
 */
export const PageLoader = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin" />
    </div>
  );
};
