import { useEffect, useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [fading, setFading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Sequence timing
    const t1 = setTimeout(() => setStep(2), 300); // Logo & brand reveal
    const t2 = setTimeout(() => setStep(3), 900); // Subtitle reveal
    const t3 = setTimeout(() => setFading(true), 2400); // Fade out to dashboard
    const t4 = setTimeout(() => onComplete(), 2700); // Complete

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 transition-all duration-500 ease-in-out ${
        fading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* STEP 1: Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-500/20 via-purple-500/15 to-pink-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-[90px] pointer-events-none animate-pulse" />

      {/* Floating subtle ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-2 h-2 rounded-full bg-cyan-400/60 blur-[1px] animate-[ping_3s_infinite]" />
        <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400/70 blur-[1px] animate-[ping_4s_infinite]" />
        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 rounded-full bg-purple-400/60 blur-[1px] animate-[ping_3.5s_infinite]" />
      </div>

      {/* Main Container */}
      <div className="relative text-center flex flex-col items-center select-none z-10 max-w-lg w-full">
        {/* STEP 2: Modern UFH Logo Reveal with Neon Glow & Shimmer */}
        <div className={`relative mb-6 transition-all duration-700 ease-out transform ${
          step >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-6'
        }`}>
          <div className="relative group">
            <img
              src="/logo.jpg"
              alt="unlimited_fun_is_here logo"
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-[0_0_40px_rgba(6,182,212,0.4)] border-2 border-cyan-500/40"
            />
            {/* Soft Light Sweep / Shimmer Effect */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-[shimmer_2.5s_infinite]" />
            </div>
          </div>
        </div>

        {/* STEP 3: Brand Name Reveal (unlimited_fun_is_here) */}
        <div className={`transition-all duration-700 delay-100 ease-out transform ${
          step >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h1 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-200 tracking-tight drop-shadow-[0_2px_10px_rgba(6,182,212,0.3)] mb-1">
            unlimited_fun_is_here
          </h1>
        </div>

        {/* STEP 4: Subtitle (GUEST TIMING MANAGEMENT) */}
        <div className={`transition-all duration-700 delay-200 ease-out transform ${
          step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}>
          <p className="text-cyan-200/70 text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase mb-8 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 inline-block" />
            <span>GUEST TIMING MANAGEMENT</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 inline-block" />
          </p>
        </div>

        {/* STEP 6: Premium Glowing Progress Bar */}
        <div className="w-56 sm:w-72 h-2 bg-slate-900/90 rounded-full p-0.5 border border-slate-800 shadow-inner overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-[2300ms] ease-out shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            style={{ width: step >= 2 ? '100%' : '0%' }}
          />
        </div>
      </div>

      {/* STEP 3: Skip Intro Button */}
      <button
        type="button"
        onClick={() => {
          setFading(true);
          setTimeout(onComplete, 200);
        }}
        className="absolute bottom-8 right-8 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-slate-300 hover:text-white text-xs font-bold tracking-wide transition-all duration-200 shadow-lg shadow-cyan-950/40 backdrop-blur hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span>Skip Intro</span>
        <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
      </button>
    </div>
  );
}
