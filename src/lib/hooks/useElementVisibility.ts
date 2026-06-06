import { useEffect, useState, type RefObject } from 'react';

/**
 * Track whether an element is at (or near) the viewport using IntersectionObserver.
 *
 * `rootMargin` is expanded by default so pages just outside the visible area are
 * considered "visible" and render ahead of time, giving smooth scrolling while
 * still keeping far-away pages unrendered (the core of viewer virtualization).
 */
export function useElementVisibility(
  ref: RefObject<Element | null>,
  options?: { root?: Element | null; rootMargin?: string },
): boolean {
  const [visible, setVisible] = useState(false);
  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin ?? '600px 0px';

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(entry.isIntersecting);
        }
      },
      { root, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, root, rootMargin]);

  return visible;
}
