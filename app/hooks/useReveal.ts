"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for intersection observer - triggers scroll-reveal animations
 * @param threshold - visibility threshold (0-1)
 * @param rootMargin - margin around root
 */
export function useReveal(threshold = 0.15, rootMargin = "0px 0px -60px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
}

/**
 * Stagger children reveal - returns delay for nth child
 */
export function staggerDelay(index: number, base = 0.08) {
  return { transitionDelay: `${index * base}s` };
}
