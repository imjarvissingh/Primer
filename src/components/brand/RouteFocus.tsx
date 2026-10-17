"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * After an in-app navigation the clicked link is gone and the browser drops
 * focus on <body>, so keyboard and screen-reader users lose their place. When
 * the path changes (and only then) this moves focus to the new page's main
 * heading. It does nothing on the first load, on component updates, or when the
 * user has already moved focus somewhere inside the page.
 */
export function RouteFocus() {
  const pathname = usePathname();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    const frame = requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active !== null && active !== document.body) return;
      const heading = document.querySelector<HTMLElement>("main h1");
      if (heading === null) return;
      if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
      heading.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
