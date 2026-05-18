import { useState, useEffect } from 'react';

const DEFAULT_MESSAGES = [
  'Assembling your panel...',
  'The panel is reading your document...',
  'Computing weighted scores and kill criteria...',
  'Generating strategic analysis...',
  'Cross-referencing archetype divergence...',
  'Finalising the verdict...',
];

interface LoadingTickerProps {
  message?: string;
  current?: number;
  total?: number;
}

export default function LoadingTicker({ message, current, total }: LoadingTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [tick, setTick] = useState(0);

  const displayMessage = message || DEFAULT_MESSAGES[currentIndex];
  const hasRealProgress = current !== undefined && total !== undefined && total > 0;
  const realProgress = hasRealProgress ? Math.min((current / total) * 100, 100) : 0;

  // Fake progress for when no real progress is provided
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);

  // Cycle through default messages when no real message is provided
  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
        setIsVisible(true);
      }, 350);
    }, 2500);
    return () => clearInterval(interval);
  }, [message]);

  const fakeProgress = hasRealProgress
    ? 0
    : Math.min(((tick % 20000) / 20000) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-3.5 h-3.5 rounded-full border-2 border-primary border-r-transparent animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <span
          className="text-xl italic font-serif text-primary transition-opacity duration-350"
          style={{
            opacity: isVisible ? 1 : 0,
            fontFamily: "'EB Garamond', Georgia, serif",
          }}
        >
          {displayMessage}
        </span>
      </div>
      <div
        className="h-0.5 rounded-full overflow-hidden"
        style={{ width: 280, background: 'rgba(201,168,76,0.15)' }}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${hasRealProgress ? realProgress : fakeProgress}%`,
            transition: 'width 300ms ease',
          }}
        />
      </div>
      {hasRealProgress && (
        <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {current} of {total} completed
        </div>
      )}
    </div>
  );
}
