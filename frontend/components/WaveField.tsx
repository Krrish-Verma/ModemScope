"use client";

import { motion, useReducedMotion } from "framer-motion";

const paths = [
  "M0 160 C180 20 300 300 500 145 S840 60 1100 160",
  "M0 190 C210 70 350 280 540 170 S860 90 1100 190",
  "M0 130 C160 250 360 0 560 150 S900 250 1100 125",
];

export function WaveField() {
  const reduced = useReducedMotion();
  return (
    <div className="wave-field" aria-hidden="true">
      <svg viewBox="0 0 1100 320" preserveAspectRatio="none">
        <defs>
          <linearGradient id="signal" x1="0" x2="1">
            <stop offset="0" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset=".48" stopColor="#38bdf8" stopOpacity=".85" />
            <stop offset="1" stopColor="#0071e3" stopOpacity="0" />
          </linearGradient>
        </defs>
        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            fill="none"
            stroke="url(#signal)"
            strokeWidth={index === 0 ? 2 : 1}
            initial={{ pathLength: reduced ? 1 : 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 0.8, 0.45] }}
            transition={{ duration: reduced ? 0 : 2.4, delay: index * 0.16 }}
          />
        ))}
      </svg>
    </div>
  );
}
