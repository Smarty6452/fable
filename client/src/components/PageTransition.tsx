"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useRef, useState, useEffect, createContext, useContext } from "react";

interface TransitionContext {
  navigateTo: (href: string) => void;
  isTransitioning: boolean;
}

const TransitionCtx = createContext<TransitionContext>({
  navigateTo: () => {},
  isTransitioning: false,
});

export const usePageTransition = () => useContext(TransitionCtx);

export default function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingRoute = useRef<string | null>(null);

  const navigateTo = useCallback((href: string) => {
    if (isTransitioning || href === pathname) return;

    pendingRoute.current = href;
    setIsTransitioning(true);

    // Show loader only if transition takes > 300ms
    loaderTimeout.current = setTimeout(() => setShowLoader(true), 300);

    // Fade out current content
    if (contentRef.current) {
      contentRef.current.classList.remove("page-enter");
      contentRef.current.classList.add("page-exit");
    }

    // Navigate after exit animation completes (200ms)
    setTimeout(() => {
      router.push(href);
    }, 200);
  }, [isTransitioning, pathname, router]);

  // When pathname changes, the new page loaded — fade in
  useEffect(() => {
    if (loaderTimeout.current) clearTimeout(loaderTimeout.current);
    setShowLoader(false);

    if (contentRef.current) {
      contentRef.current.classList.remove("page-exit");
      contentRef.current.classList.add("page-enter");
    }

    // Small delay to let the enter animation finish
    const t = setTimeout(() => {
      setIsTransitioning(false);
      pendingRoute.current = null;
    }, 300);

    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <TransitionCtx.Provider value={{ navigateTo, isTransitioning }}>
      {/* Transition overlay */}
      <div className={`route-overlay ${isTransitioning ? "active" : ""}`}>
        {showLoader && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="route-loader" />
          </div>
        )}
      </div>

      {/* Page content with enter/exit animations */}
      <div ref={contentRef} className="page-enter">
        {children}
      </div>
    </TransitionCtx.Provider>
  );
}
