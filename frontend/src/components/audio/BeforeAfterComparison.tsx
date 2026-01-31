'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface BeforeAfterComparisonProps {
  originalText: string;
  improvedText: string;
  originalAudioUrl?: string;
  improvedAudioUrl?: string;
  duration?: number;
  formatDuration?: (seconds: number) => string;
}

type ComparisonMode = 'improved' | 'original';

export function BeforeAfterComparison({
  originalText,
  improvedText,
  originalAudioUrl,
  improvedAudioUrl,
  duration,
  formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
}: BeforeAfterComparisonProps) {
  const [mode, setMode] = useState<ComparisonMode>('improved');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const originalAudioRef = useRef<HTMLAudioElement>(null);
  const improvedAudioRef = useRef<HTMLAudioElement>(null);

  const currentAudioRef = mode === 'improved' ? improvedAudioRef : originalAudioRef;
  const currentAudioUrl = mode === 'improved' ? improvedAudioUrl : originalAudioUrl;
  const currentText = mode === 'improved' ? improvedText : originalText;

  // 모드 전환 시 오디오 정지
  useEffect(() => {
    originalAudioRef.current?.pause();
    improvedAudioRef.current?.pause();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [mode]);

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = currentAudioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setAudioDuration(audio.duration || 0);
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentAudioRef, mode]);

  const togglePlayPause = () => {
    const audio = currentAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = currentAudioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Toggle Switch - 비교 버튼 */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center bg-secondary/60 rounded-lg p-1">
          <button
            onClick={() => setMode('original')}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
              ${mode === 'original'
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-gray-warm hover:text-charcoal'
              }
            `}
          >
            원본
          </button>
          <button
            onClick={() => setMode('improved')}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
              ${mode === 'improved'
                ? 'bg-teal text-white shadow-sm'
                : 'text-gray-warm hover:text-charcoal'
              }
            `}
          >
            AI 개선
          </button>
        </div>
      </div>

      {/* Content Card */}
      <Card className={`
        p-5 transition-colors
        ${mode === 'improved'
          ? 'bg-teal-light/15 border border-teal/15'
          : 'bg-warm-white border-none'
        }
      `}>
        {/* Header Badge */}
        <div className="mb-3">
          <span className={`
            inline-block px-2 py-0.5 rounded text-xs font-medium
            ${mode === 'improved'
              ? 'bg-teal/10 text-teal'
              : 'bg-gray-soft/20 text-gray-warm'
            }
          `}>
            {mode === 'improved' ? 'AI 개선 버전' : '나의 원본'}
          </span>
        </div>

        {/* Text Content */}
        <p className={`
          leading-relaxed mb-6
          ${mode === 'improved' ? 'text-charcoal' : 'text-charcoal/70'}
        `}>
          {currentText}
        </p>

        {/* Audio Player */}
        {currentAudioUrl && (
          <div className={`
            p-4 rounded-xl
            ${mode === 'improved' ? 'bg-teal/10' : 'bg-secondary/50'}
          `}>
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                  ${mode === 'improved'
                    ? 'bg-teal text-white hover:bg-teal-dark'
                    : 'bg-charcoal text-white hover:bg-charcoal/80'
                  }
                `}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Progress Bar */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-2 appearance-none bg-transparent cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${
                        mode === 'improved' ? '#0D9488' : '#1C1917'
                      } ${progressPercentage}%, ${
                        mode === 'improved' ? '#ccfbf1' : '#e5e5e5'
                      } ${progressPercentage}%)`,
                      borderRadius: '9999px',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-soft mt-1">
                  <span>{formatDuration(Math.floor(currentTime))}</span>
                  <span>{formatDuration(Math.floor(audioDuration))}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Audio Elements */}
        <audio ref={originalAudioRef} src={originalAudioUrl} preload="metadata">
          <track kind="captions" />
        </audio>
        <audio ref={improvedAudioRef} src={improvedAudioUrl} preload="metadata">
          <track kind="captions" />
        </audio>
      </Card>

      {/* Comparison Hint */}
      <p className="text-center text-xs text-gray-soft">
        원본과 AI 개선 버전을 비교해보세요
      </p>
    </div>
  );
}
