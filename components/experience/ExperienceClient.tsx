"use client";

import dynamic from "next/dynamic";

// WebGL + GSAP are browser-only; skip prerendering the experience entirely.
const Experience = dynamic(() => import("./Experience"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-background" />,
});

export default function ExperienceClient() {
  return <Experience />;
}
