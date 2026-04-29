import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BsEye, BsEyeSlash } from "react-icons/bs";
import LogoMark from "../components/LogoMark";
import AuthThemeToggle from "../components/AuthThemeToggle";

const Feature = ({ emoji, title, desc }) => (
  <div className="flex items-start gap-3.5">
    <div className="w-10 h-10 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
      {emoji}
    </div>
    <div>
      <p className="text-white/80 font-semibold text-[14px] leading-snug">{title}</p>
      <p className="text-white/40 text-[13px] mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </div>
);

export default function Register() {
  const emailRef = useRef();
  const usernameRef = useRef();
  const passwordRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, authError } = useAuth();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const user = {
      email: emailRef.current.value,
      username: usernameRef.current.value,
      password: passwordRef.current.value,
    };
    await register(user);
    setIsLoading(false);
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-background animate-page-enter">

      {/* ── LEFT: Visual Panel ───────────────────────────────────── */}
      <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[58%] h-full relative overflow-hidden items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0c1020 0%, #1a1040 50%, #0c1020 100%)" }}>

        {/* Ambient blurs */}
        <div className="absolute top-[5%] right-[10%] w-[45%] h-[45%] rounded-full bg-primary/25 blur-[110px] animate-glow-pulse" />
        <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-pink-500/20 blur-[100px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[45%] left-[35%] w-[25%] h-[25%] rounded-full bg-violet-400/15 blur-[70px] animate-glow-pulse" style={{ animationDelay: "3s" }} />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1.5px 1.5px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />

        {/* Main card */}
        <div className="relative z-10 w-full max-w-[420px] px-8 flex flex-col gap-8">

          {/* Headline */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/60 text-[12px] font-semibold tracking-wide">Free to join</span>
            </div>
            <h2 className="text-[2.4rem] font-extrabold text-white leading-[1.15] tracking-tight mb-4">
              Your people are<br />
              <span className="bg-gradient-to-r from-primary via-violet-400 to-pink-400 bg-clip-text text-transparent">
                already here.
              </span>
            </h2>
            <p className="text-white/50 text-[15px] leading-relaxed">
              Set up your account and start messaging in seconds. Group chats, video calls, file sharing. Everything in one app.
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <Feature
              emoji="💬"
              title="Message anyone, anytime"
              desc="Private DMs or group chats with everyone you care about."
            />
            <Feature
              emoji="📹"
              title="See each other, not just text"
              desc="High-quality video calls. No downloads, no setup required."
            />
            <Feature
              emoji="📎"
              title="Share anything"
              desc="Photos, videos, documents. Send any file in any conversation."
            />
            <Feature
              emoji="🌙"
              title="Easy on the eyes"
              desc="Looks great day or night with dark and light mode built in."
            />
          </div>

          {/* Bottom pill */}
          <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5">
              <span className="text-2xl">🔒</span>
              <p className="text-[13px] text-white/50 leading-snug">
                Your chats stay private. We don't read your messages. Ever.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── RIGHT: Form ──────────────────────────────────────────── */}
      <div className="w-full lg:w-[45%] xl:w-[42%] h-full flex flex-col justify-center px-8 md:px-14 lg:px-20 xl:px-28 relative z-10 bg-background">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        {/* Brand */}
        <div className="absolute top-8 right-8 md:top-10 md:right-12 flex items-center gap-2.5">
          <span className="text-xl font-bold tracking-tight text-foreground">BaatCheet</span>
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-base shadow-lg shadow-primary/25">
            <LogoMark className="w-5 h-5" />
          </div>
        </div>

        <AuthThemeToggle className="absolute top-8 left-8 md:top-10 md:left-12" />

        {/* Header */}
        <div className="mb-8 w-full max-w-[360px] animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <h2 className="font-bold text-[2rem] md:text-[2.4rem] text-foreground tracking-tight leading-tight mb-2">
            Create your account
          </h2>
          <p className="text-muted-foreground text-[15px]">
            Free forever. No credit card. Ready in under a minute.
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
            <label htmlFor="register-email" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-widest pl-0.5">Email</label>
            <input
              id="register-email"
              type="email"
              required
              placeholder="you@example.com"
              ref={emailRef}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:bg-background transition-all duration-200 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-username" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-widest pl-0.5">Username</label>
            <input
              id="register-username"
              type="text"
              required
              placeholder="How should people find you?"
              ref={usernameRef}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:bg-background transition-all duration-200 shadow-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="register-password" className="text-[11px] font-semibold text-foreground/70 uppercase tracking-widest pl-0.5">Password</label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Create a password"
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
            data-tooltip="Create your account"
            className="hci-tooltip w-full py-3.5 mt-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold text-[15px] shadow-lg shadow-primary/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Creating account...</>
            ) : "Create my account"}
          </button>
        </form>

        <p className="mt-7 text-[13px] text-muted-foreground max-w-[360px] animate-slide-up" style={{ animationDelay: "0.15s" }}>
          Already have an account?{" "}
          <Link className="text-primary font-semibold hover:text-primary/80 transition-colors" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
