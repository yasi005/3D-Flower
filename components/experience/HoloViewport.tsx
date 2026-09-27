"use client";

import type { PanelMode } from "./config";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Static archival still — inline so petals can read the live `--accent`
 * (same variable the title / rules / nav use). No WebGL.
 */
export default function HoloViewport({ mode, index }: { mode: PanelMode; index: number }) {
  const detail = mode === "detail";
  // unique gradient ids per instance (two cards share a chapter)
  const uid = `${pad(index + 1)}-${mode}`;

  return (
    <svg
      viewBox={detail ? "80 60 320 320" : "0 0 480 600"}
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="55%" r="65%">
          <stop offset="0%" stopColor="#2a2824" />
          <stop offset="55%" stopColor="#1a1917" />
          <stop offset="100%" stopColor="#121110" />
        </radialGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="48%" r="42%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width="480" height="600" fill={`url(#bg-${uid})`} />
      <ellipse cx="240" cy="312" rx="140" ry="120" fill={`url(#glow-${uid})`} />

      <g filter={`url(#soft-${uid})`} opacity="0.95">
        {/* outer petals — chapter accent */}
        <g fill="var(--accent)" fillOpacity="0.28">
          <path d="M256.2,315.3 Q339.5,374.8 347.8,333.9 Q356.1,292.9 256.2,315.3" />
          <path d="M251.2,324.2 Q283.6,421.3 314.4,393.0 Q345.2,364.8 251.2,324.2" />
          <path d="M241.9,328.4 Q211.0,426.0 252.5,421.3 Q294.1,416.5 241.9,328.4" />
          <path d="M231.9,326.4 Q149.5,387.2 185.9,407.8 Q222.3,428.3 231.9,326.4" />
          <path d="M225.0,318.9 Q122.6,319.7 139.9,357.7 Q157.3,395.7 225.0,318.9" />
          <path d="M223.8,308.7 Q140.5,249.2 132.2,290.1 Q123.9,331.1 223.8,308.7" />
          <path d="M228.8,299.8 Q196.4,202.7 165.6,231.0 Q134.8,259.2 228.8,299.8" />
          <path d="M238.1,295.6 Q269.0,198.0 227.5,202.7 Q185.9,207.5 238.1,295.6" />
          <path d="M248.1,297.6 Q330.5,236.8 294.1,216.2 Q257.7,195.7 248.1,297.6" />
          <path d="M255.0,305.1 Q357.4,304.3 340.1,266.3 Q322.7,228.3 255.0,305.1" />
        </g>
        {/* mid ring — accent mixed toward white via opacity stack */}
        <g fill="var(--accent)" fillOpacity="0.45">
          <path d="M249.7,316.7 Q292.9,368.0 304.8,343.3 Q316.7,318.7 249.7,316.7" />
          <path d="M243.6,322.2 Q237.9,389.0 263.7,380.0 Q289.5,371.0 243.6,322.2" />
          <path d="M235.3,321.7 Q184.0,364.9 208.7,376.8 Q233.3,388.7 235.3,321.7" />
          <path d="M229.8,315.6 Q163.0,309.9 172.0,335.7 Q181.0,361.5 229.8,315.6" />
          <path d="M230.3,307.3 Q187.1,256.0 175.2,280.7 Q163.3,305.3 230.3,307.3" />
          <path d="M236.4,301.8 Q242.1,235.0 216.3,244.0 Q190.5,253.0 236.4,301.8" />
          <path d="M244.7,302.3 Q296.0,259.1 271.3,247.2 Q246.7,235.3 244.7,302.3" />
          <path d="M250.2,308.4 Q317.0,314.1 308.0,288.3 Q299.0,262.5 250.2,308.4" />
        </g>
        {/* inner petals */}
        <g fill="var(--accent)" fillOpacity="0.65">
          <path d="M246.0,312.6 Q278.3,331.1 279.8,316.0 Q281.3,300.9 246.0,312.6" />
          <path d="M242.5,317.5 Q242.6,354.7 256.4,348.5 Q270.3,342.2 242.5,317.5" />
          <path d="M236.5,316.9 Q204.3,335.6 216.6,344.5 Q229.0,353.3 236.5,316.9" />
          <path d="M234.0,311.4 Q201.7,292.9 200.2,308.0 Q198.7,323.1 234.0,311.4" />
          <path d="M237.5,306.5 Q237.4,269.3 223.6,275.5 Q209.7,281.8 237.5,306.5" />
          <path d="M243.5,307.1 Q275.7,288.4 263.4,279.5 Q251.0,270.7 243.5,307.1" />
        </g>
        <circle cx="240" cy="312" r="14" fill="var(--accent)" fillOpacity="0.75" />
        <circle cx="240" cy="312" r="6" fill="#f7f2ea" fillOpacity="0.85" />
      </g>

      <text
        x="456"
        y="578"
        textAnchor="end"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontSize="22"
        fill="var(--accent)"
        fillOpacity="0.5"
      >
        {pad(index + 1)}
      </text>
    </svg>
  );
}
