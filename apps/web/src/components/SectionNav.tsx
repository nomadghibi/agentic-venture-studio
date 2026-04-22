"use client";

import { useEffect, useState } from "react";

const SECTION_LINKS = [
  { id: "why", label: "Why This" },
  { id: "workflow", label: "Workflow" },
  { id: "pricing", label: "Pricing" },
  { id: "demo", label: "Demo Plan" }
] as const;

type SectionId = (typeof SECTION_LINKS)[number]["id"];

function getActiveSection(): SectionId {
  const scrollPosition = window.scrollY + 140;
  let active: SectionId = SECTION_LINKS[0].id;

  for (const link of SECTION_LINKS) {
    const section = document.getElementById(link.id);
    if (!section) {
      continue;
    }

    if (section.offsetTop <= scrollPosition) {
      active = link.id;
    }
  }

  return active;
}

export function SectionNav() {
  const [activeId, setActiveId] = useState<SectionId>(SECTION_LINKS[0].id);

  useEffect(() => {
    const updateFromScroll = () => {
      const next = getActiveSection();
      setActiveId((previous) => (previous === next ? previous : next));
    };

    let ticking = false;
    const onScrollOrResize = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(() => {
        updateFromScroll();
        ticking = false;
      });
    };

    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) {
        return;
      }

      const hasSection = SECTION_LINKS.some((link) => link.id === hash);
      if (hasSection) {
        setActiveId(hash as SectionId);
      }
    };

    updateFromScroll();
    onHashChange();

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return (
    <header className="site-nav">
      <a href="/" className="site-brand">
        Agentic Venture Studio
      </a>
      <nav className="site-nav-links" aria-label="Primary">
        {SECTION_LINKS.map((link) => {
          const isActive = link.id === activeId;
          return (
            <a key={link.id} href={`#${link.id}`} data-active={isActive ? "true" : "false"}>
              {link.label}
            </a>
          );
        })}
      </nav>
      <a href="/workspace" className="btn btn-ghost nav-cta">
        Open Workspace
      </a>
    </header>
  );
}
