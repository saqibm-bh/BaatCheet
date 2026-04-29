import React from "react";

export default function LogoMark({ className = "", title = "BaatCheet" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {title ? <title>{title}</title> : null}
      {/* Chat bubble outline */}
      <path
        d="M7.2 6.6h9.6a3.6 3.6 0 0 1 3.6 3.6v3.9a3.6 3.6 0 0 1-3.6 3.6H11l-3.9 2.7v-2.7H7.2a3.6 3.6 0 0 1-3.6-3.6v-3.9a3.6 3.6 0 0 1 3.6-3.6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Calligraphy-like stroke */}
      <path
        d="M7.6 12.1c2.1-2.8 4.5 2.2 7-.7 0 0 1.2-1.5 3.2-.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Dots reminiscent of script diacritics */}
      <circle cx="9.3" cy="14.6" r="0.75" fill="currentColor" />
      <circle cx="12.2" cy="14.9" r="0.55" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
