import React, { useState, useEffect } from 'react';

const messages = [
  'Assembling your panel...',
  'The panel is reading your document...',
  'Computing weighted scores and kill criteria...',
  'Generating strategic analysis...',
  'Cross-referencing archetype divergence...',
  'Finalising the verdict...',
];

const MESSAGE_INTERVAL = 2500; // 2.5 seconds per message
const TOTAL_DURATION = messages.length * MESSAGE_INTERVAL; // 15 seconds
const PROGRESS_DURATION = 20000; // 20 seconds to fill progress bar

export default function LoadingTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = (prev + 1) % messages.length;
          return next;
        });
        setIsVisible(true);
      }, 350); // fade out duration
    }, MESSAGE_INTERVAL);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / PROGRESS_DURATION) * 100, 100);
      setProgress(pct);
    }, 50);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [startTime]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-3 mb-6">
        {/* Spinning gold circle */}
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
          {messages[currentIndex]}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="h-0.5 rounded-full overflow-hidden"
        style={{ width: 280, background: 'rgba(201,168,76,0.15)' }}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
        />
      </div>
    </div>
  );
}
