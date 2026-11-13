// ====================
// UQ PLATFORM — ANIMATIONS RÉUTILISABLES
// ====================

export const UQ_ANIMATIONS = {
  // ===== Entrées =====
  fadeIn: 'uq-fade-in',
  slideUp: 'uq-slide-up',
  slideInRight: 'uq-slide-in-right',
  slideInLeft: 'uq-slide-in-left',
  scaleIn: 'uq-scale-in',
  popIn: 'uq-pop-in',

  // ===== Sorties =====
  fadeOut: 'uq-fade-out',
  slideDown: 'uq-slide-down',

  // ===== Boucles =====
  pulse: 'uq-pulse',
  float: 'uq-float',
  shimmer: 'uq-shimmer',
  gradientShift: 'uq-gradient-shift',
  rotate: 'uq-rotate',
  spinSlow: 'uq-spin-slow',

  // ===== Feedback =====
  bounce: 'uq-bounce',
  shake: 'uq-shake',
  glow: 'uq-glow',
};

// ===== Durées standard =====
export const UQ_DURATIONS = {
  fast: 150,
  base: 250,
  slow: 400,
  slowest: 600,
};

// ===== Easings =====
export const UQ_EASINGS = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
};

// ===== CSS keyframes à injecter dans index.css =====
export const UQ_KEYFRAMES_CSS = `
@keyframes uq-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes uq-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes uq-slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes uq-slide-down {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}

@keyframes uq-slide-in-right {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes uq-slide-in-left {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes uq-scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes uq-pop-in {
  0% { opacity: 0; transform: scale(0.8); }
  50% { transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes uq-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes uq-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes uq-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes uq-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes uq-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes uq-spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes uq-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes uq-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@keyframes uq-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(181,55,140,0.4); }
  50% { box-shadow: 0 0 24px rgba(181,55,140,0.8); }
}

/* Classes utilitaires */
.uq-animate-fade-in { animation: uq-fade-in 0.3s ease forwards; }
.uq-animate-slide-up { animation: uq-slide-up 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.uq-animate-slide-in-right { animation: uq-slide-in-right 0.3s ease forwards; }
.uq-animate-scale-in { animation: uq-scale-in 0.25s ease forwards; }
.uq-animate-pop-in { animation: uq-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
.uq-animate-pulse { animation: uq-pulse 2s ease-in-out infinite; }
.uq-animate-float { animation: uq-float 3s ease-in-out infinite; }
.uq-animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
  animation: uq-shimmer 2s linear infinite;
}
.uq-animate-gradient {
  background-size: 200% 200%;
  animation: uq-gradient-shift 4s ease infinite;
}
.uq-animate-rotate { animation: uq-rotate 1.5s linear infinite; }
.uq-animate-spin-slow { animation: uq-spin-slow 3s linear infinite; }
.uq-animate-bounce { animation: uq-bounce 0.6s ease infinite; }
.uq-animate-shake { animation: uq-shake 0.4s ease; }
.uq-animate-glow { animation: uq-glow 2s ease-in-out infinite; }

/* Hide scrollbar */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Selection UQ */
::selection {
  background: rgba(181,55,140,0.4);
  color: #FFFFFF;
}
`;

export default UQ_ANIMATIONS;
