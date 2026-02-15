import { useState, useEffect } from 'react';

export default function LandscapeBlocker() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsLandscape(window.matchMedia('(orientation: landscape)').matches && window.innerWidth < 900);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isLandscape) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-bg flex flex-col items-center justify-center text-center p-8">
      <div className="text-6xl mb-6">📱</div>
      <h2 className="text-2xl font-bold text-gold mb-3">Rode o telemóvel</h2>
      <p className="text-text-muted text-sm">
        Este quiz funciona melhor em modo retrato.
      </p>
    </div>
  );
}
