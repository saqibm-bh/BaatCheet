import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import LogoMark from "../components/LogoMark";
import AuthThemeToggle from "../components/AuthThemeToggle";

// Floating chat bubble component
const ChatBubble = ({ text, name, color, className }) => (
  <div className={`flex items-end gap-2.5 ${className}`}>
    <div className={`w-8 h-8 rounded-full ${color} flex-shrink-0 shadow-md`} />
    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-lg max-w-[200px]">
      <p className="text-white/90 text-[13px] font-medium leading-snug">{text}</p>
      <p className="text-white/30 text-[10px] mt-1">{name} · just now</p>
    </div>
  </div>
);

export default function Login() {
  const userIdRef = useRef();
  const passwordRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, authError } = useAuth();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const user = {
      userId: userIdRef.current.value,
      password: passwordRef.current.value,
    };
    await login(user);
    setIsLoading(false);
  };

  return (
    <div className="w-full h-[100dvh] flex overflow-hidden bg-background animate-page-enter">

      {/* ── LEFT: Form ────────────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] xl:w-[42%] h-full flex flex-col justify-center px-8 md:px-14 lg:px-20 xl:px-28 relative z-10 bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="absolute top-8 left-8 md:top-10 md:left-12 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-base shadow-lg shadow-primary/25">
            <LogoMark className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">BaatCheet</span>
        </div>

        <AuthThemeToggle className="absolute top-8 right-8 md:top-10 md:right-12" />

        {/* Header */}
        <div className="mb-8 w-full max-w-[360px] animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <h2 className="font-bold text-[2rem] md:text-[2.4rem] text-foreground tracking-tight leading-tight mb-2">
            Welcome back
          </h2>
          <p className="text-muted-foreground text-[15px]">
            Your chats are waiting. Sign in to catch up.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="w-full max-w-[360px] flex flex-col gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          {authError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium flex items-center gap-2.5 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 animate-pulse" />
              {authError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-userid" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-widest pl-0.5">Email or Username</label>
            <input
              id="login-userid"
              type="text"
              required
              placeholder="you@example.com"
              ref={userIdRef}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:bg-background transition-all duration-200 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-password" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-widest pl-0.5 flex items-center justify-between">
              Password
              <span className="text-primary text-[12px] font-semibold normal-case tracking-normal cursor-pointer hover:text-primary/70 transition-colors">
                Forgot password?
              </span>
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                ref={passwordRef}
                className="w-full px-4 py-3 pr-12 bg-muted/50 border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:bg-background transition-all duration-200 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                data-tooltip={showPassword ? "Hide password" : "Show password"}
                className="hci-tooltip absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <BsEyeSlash className="text-lg" /> : <BsEye className="text-lg" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            data-tooltip="Sign in to your account"
            className="hci-tooltip w-full py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Signing in...</>
            ) : "Sign in"}
          </button>
        </form>

        <p className="mt-7 text-[13px] text-muted-foreground max-w-[360px] animate-slide-up" style={{ animationDelay: "0.15s" }}>
          Don't have an account?{" "}
          <Link className="text-primary font-semibold hover:text-primary/80 transition-colors" to="/register">
            Sign up, it's free
          </Link>
        </p>
      </div>

      {/* ── RIGHT: Visual Panel ───────────────────────────────────── */}
      <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[58%] h-full relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>

        {/* Ambient blurs */}
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-[100px] animate-glow-pulse" />
        <div className="absolute bottom-[15%] right-[15%] w-[35%] h-[35%] rounded-full bg-violet-500/25 blur-[90px] animate-glow-pulse" style={{ animationDelay: "2s" }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        {/* Main card */}
        <div className="relative z-10 w-full max-w-[420px] px-8 flex flex-col gap-6">

          {/* Headline */}
          <div className="animate-slide-up">
            <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">BaatCheet</p>
            <h2 className="text-[2.4rem] font-extrabold text-white leading-[1.15] tracking-tight mb-4">
              Stay close to the<br/>
              people who matter.
            </h2>
            <p className="text-white/50 text-[15px] leading-relaxed">
              Send a message, share a moment, or jump on a quick call. All without switching apps.
            </p>
          </div>

          {/* Live chat preview bubbles */}
          <div className="flex flex-col gap-3 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <ChatBubble
              text="Hey! Are you free tonight? 🎉"
              name="Sarah"
              color="bg-emerald-400"
              className="animate-float"
            />
            <ChatBubble
              text="Just sent you the files. Check the group chat!"
              name="Marcus"
              color="bg-sky-400"
              className="ml-6 animate-float-delayed"
            />
            <div className="flex items-end gap-2.5 animate-float" style={{ animationDelay: "0.8s" }}>
              <div className="w-8 h-8 rounded-full bg-rose-400 flex-shrink-0 shadow-md" />
              <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-lg">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-white/30 text-[10px] mt-1">Aisha is typing...</p>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="flex items-center gap-4 pt-2 border-t border-white/10 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex -space-x-2.5">
              {["bg-emerald-400", "bg-sky-400", "bg-rose-400", "bg-amber-400", "bg-violet-400"].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#0f172a] ${c} shadow-sm`} />
              ))}
            </div>
            <p className="text-white/40 text-[13px] font-medium">
              Join people already <span className="text-white/70 font-semibold">chatting every day</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
