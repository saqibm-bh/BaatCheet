import React, { useEffect, useState, useRef } from "react";
import { BiSearch } from "../assets";
import { BsCommand, BsMoonStarsFill, BsSunFill, BsChatTextFill, BsRobot } from "react-icons/bs";
import { useChat } from "../context/ChatContext";

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);
  
  const { setOpenAddChat } = useChat();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTheme = () => {
    const currentTheme = localStorage.getItem("theme");
    if (currentTheme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsOpen(false);
  };

  const actions = [
    { id: 1, name: "Start new chat", icon: <BsChatTextFill className="text-primary"/>, action: () => { setOpenAddChat(true); setIsOpen(false); } },
    { id: 2, name: "Toggle Theme", icon: <BsMoonStarsFill className="text-amber-500" />, action: toggleTheme },
    { id: 3, name: "Ask AI Assistant", icon: <BsRobot className="text-emerald-500" />, action: () => setIsOpen(false) },
  ];

  const filteredActions = actions.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={() => setIsOpen(false)}
      ></div>
      
      <div className="relative w-full max-w-2xl bg-background border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col transform-gpu transition-all scale-100 opacity-100 ring-1 ring-white/10">
        
        {/* Search Header */}
        <div className="flex items-center px-4 py-4 border-b border-border/50 bg-muted/20">
          <BiSearch className="text-muted-foreground text-xl mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-foreground outline-none placeholder:text-muted-foreground text-lg"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold tracking-wider">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {filteredActions.length > 0 ? (
            <div className="mb-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Suggestions
              </div>
              {filteredActions.map((action) => (
                <div
                  key={action.id}
                  onClick={action.action}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-muted/60 focus:bg-muted rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-background shadow-sm border border-border/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-foreground font-semibold">{action.name}</span>
                    <span className="text-xs text-muted-foreground">Action command</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <BiSearch className="text-muted-foreground text-xl" />
              </div>
              <p className="text-foreground font-medium">No results found.</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different command or term.</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-t border-border/50 text-[10px] text-muted-foreground font-medium uppercase tracking-widest hidden md:flex">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <div className="flex gap-1">
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">↓</kbd>
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">↑</kbd>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <span>Select</span>
             <kbd className="bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">ENTER</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
