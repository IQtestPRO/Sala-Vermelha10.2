"use client";
import { motion } from "motion/react";
import React from "react";

// LoaderThree (Aceternity) com o RAIO trocado pelo PULSO DE ECG do STAT:
// o pulso se desenha (pathLength) e preenche de vermelho, em loop.
const STAT_PULSE =
  "M 3425 2117 L 3422 2110 L 3410 2102 L 3161 2102 L 3113 2052 L 3093 2037 L 3066 2026 L 3049 2025 L 3037 2027 L 3018 2035 L 2997 2050 L 2948 2101 L 2813 2102 L 2802 2108 L 2797 2116 L 2762 2296 L 2757 2311 L 2755 2307 L 2699 1731 L 2693 1648 L 2685 1635 L 2675 1631 L 2668 1631 L 2658 1635 L 2650 1647 L 2594 2128 L 2590 2142 L 2574 2113 L 2564 2104 L 2558 2102 L 2471 2101 L 2412 2033 L 2397 2022 L 2385 2017 L 2373 2018 L 2351 2032 L 2286 2102 L 687 2102 L 673 2110 L 669 2126 L 673 2136 L 685 2144 L 1407 2146 L 2294 2145 L 2311 2138 L 2382 2062 L 2444 2134 L 2455 2143 L 2461 2145 L 2543 2145 L 2587 2219 L 2598 2227 L 2612 2228 L 2623 2221 L 2628 2208 L 2667 1868 L 2670 1862 L 2676 1907 L 2729 2465 L 2732 2473 L 2738 2479 L 2751 2483 L 2763 2479 L 2771 2468 L 2799 2319 L 2831 2161 L 2836 2145 L 2955 2145 L 2962 2143 L 3024 2082 L 3037 2072 L 3048 2068 L 3065 2070 L 3077 2077 L 3134 2133 L 3144 2141 L 3152 2144 L 3411 2144 L 3422 2136 L 3425 2129 Z";

export const LoaderThree = ({ className }: { className?: string }) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="650 1600 2800 920"
      fill="none"
      stroke="var(--red, #DF212D)"
      strokeWidth="26"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-12 w-52"}
      style={{ overflow: "visible" }}
    >
      <motion.path
        initial={{ pathLength: 0, fill: "rgba(223,33,45,0)" }}
        animate={{ pathLength: 1, fill: "rgba(223,33,45,1)" }}
        transition={{
          duration: 1.6,
          ease: "easeInOut" as const,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        fillRule="evenodd"
        d={STAT_PULSE}
      />
    </motion.svg>
  );
};

export const LoaderFive = ({ text }: { text: string }) => {
  return (
    <div className="font-sans font-bold [--shadow-color:var(--color-neutral-100)]">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.1, 1],
            textShadow: [
              "0 0 0 var(--shadow-color)",
              "0 0 1px var(--shadow-color)",
              "0 0 0 var(--shadow-color)",
            ],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: i * 0.05,
            ease: "easeInOut" as const,
            repeatDelay: 2,
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </div>
  );
};
