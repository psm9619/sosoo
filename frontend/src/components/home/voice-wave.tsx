'use client';

import { cn } from '@/lib/utils';

interface VoiceWaveProps {
  className?: string;
  isAnimating?: boolean;
  barCount?: number;
}

export function VoiceWave({ className, isAnimating = true, barCount = 40 }: VoiceWaveProps) {
  return (
    <div className={cn('flex items-center justify-center gap-[3px] h-24', className)}>
      {Array.from({ length: barCount }).map((_, i) => {
        // Create a natural wave pattern
        const baseHeight = Math.sin((i / barCount) * Math.PI) * 0.7 + 0.3;
        const delay = (i * 50) % 500;

        return (
          <div
            key={i}
            className={cn(
              'w-1 rounded-full bg-gradient-to-t from-teal to-teal-dark/70 origin-center',
              isAnimating && 'animate-wave-pulse'
            )}
            style={{
              height: `${baseHeight * 100}%`,
              animationDelay: `${delay}ms`,
              animationDuration: `${800 + Math.random() * 400}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
