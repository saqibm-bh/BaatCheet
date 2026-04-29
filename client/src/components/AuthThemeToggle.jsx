import React from "react";
import ThemeSwitchButton from "./ThemeSwitchButton";

export default function AuthThemeToggle({ className = "" }) {
  return (
    <div
      className={`hci-tooltip z-20 h-11 w-11 rounded-full bg-background/75 backdrop-blur-md border border-border/60 shadow-md hover:shadow-lg transition-shadow ${className}`}
      data-tooltip="Toggle theme"
      data-tooltip-pos="bottom"
    >
      <ThemeSwitchButton />
    </div>
  );
}
