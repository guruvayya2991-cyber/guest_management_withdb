import { useEffect, useState } from 'react';
import { Clock, Play } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 2.2 seconds display + 0.3s fade out = 2.5 seconds total
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    const completeTimer = setTimeout(() => onComplete(), 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-4 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background glow accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="relative text-center flex flex-col items-center select-none">
        {/* Animated Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-cyan-500/40 animate-bounce">
            <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950" strokeWidth={2.5} />
          </div>
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 to-emerald-500 blur-sm opacity-50 -z-10 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-wider mb-2 drop-shadow-md animate-[fadeIn_0.6s_ease-out]">
          UNLIMITED FUN
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm sm:text-lg font-semibold tracking-widest uppercase mb-8 animate-[fadeIn_1s_ease-out]">
          Guest Timing Management
        </p>

        {/* Progress Bar */}
        <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-[2200ms] ease-out"
            style={{ width: fading ? '100%' : '100%', animation: 'growWidth 2.2s linear forwards' }}
          />
        </div>
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute bottom-8 right-8 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white text-xs font-semibold tracking-wide transition-all shadow-lg backdrop-blur"
      >
        <span>Skip Intro</span>
        <Play className="w-3 h-3 fill-current" />
      </button>

      <style>{`
        @keyframes growWidth {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
