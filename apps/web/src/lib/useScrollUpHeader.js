import { useEffect, useRef, useState } from "react";

export function useScrollUpHeader({ threshold = 180, tolerance = 10 } = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    lastScrollYRef.current = window.scrollY;

    function updateVisibility() {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const delta = currentScrollY - previousScrollY;

      if (currentScrollY <= threshold) {
        setIsVisible(false);
      } else if (delta <= -tolerance) {
        setIsVisible(true);
      } else if (delta >= tolerance) {
        setIsVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    }

    function handleScroll() {
      if (tickingRef.current) {
        return;
      }

      tickingRef.current = true;
      window.requestAnimationFrame(updateVisibility);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, tolerance]);

  return isVisible;
}
