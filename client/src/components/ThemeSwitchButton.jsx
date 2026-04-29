import React, { useContext } from "react";
import ThemeContext from "../context/ThemeContext";
import { PiSunLight, IoIosMoon } from "../assets";

export default function ThemeSwitchButton() {
  const { currentTheme, changeCurrentTheme } = useContext(ThemeContext);

  const handleButtonClick = () => {
    changeCurrentTheme(currentTheme === "light" ? "dark" : "light");
  };

  return (
    <button 
      className="flex items-center justify-center w-full h-full text-2xl transition-transform duration-300 active:scale-75" 
      onClick={handleButtonClick}
      aria-label="Toggle Dark Mode"
    >
      {currentTheme === "light" ? (
        <IoIosMoon className="text-slate-700 animate-fade-in" />
      ) : (
        <PiSunLight className="text-amber-400 animate-fade-in drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
      )}
    </button>
  );
}
