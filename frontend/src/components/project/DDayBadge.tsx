'use client';

interface DDayBadgeProps {
  targetDate: string | null | undefined; // ISO date string (YYYY-MM-DD)
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function DDayBadge({
  targetDate,
  size = 'md',
  showLabel = true,
}: DDayBadgeProps) {
  if (!targetDate) return null;

  // D-Day 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // D-Day 텍스트
  let dDayText: string;
  let urgencyColor: string;

  if (diffDays < 0) {
    dDayText = `D+${Math.abs(diffDays)}`;
    urgencyColor = 'bg-gray-soft text-gray-warm'; // 지남
  } else if (diffDays === 0) {
    dDayText = 'D-Day';
    urgencyColor = 'bg-coral text-white'; // 오늘
  } else if (diffDays <= 3) {
    dDayText = `D-${diffDays}`;
    urgencyColor = 'bg-coral text-white'; // 긴급
  } else if (diffDays <= 7) {
    dDayText = `D-${diffDays}`;
    urgencyColor = 'bg-amber-500 text-white'; // 주의
  } else {
    dDayText = `D-${diffDays}`;
    urgencyColor = 'bg-teal text-white'; // 여유
  }

  // 날짜 포맷
  const formattedDate = new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(target);

  // 사이즈별 스타일
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full font-bold ${urgencyColor} ${sizeStyles[size]}`}>
        {dDayText}
      </span>
      {showLabel && size !== 'sm' && (
        <span className="text-sm text-gray-warm">{formattedDate}</span>
      )}
    </div>
  );
}

// D-Day 계산 유틸리티 함수 (다른 곳에서도 사용 가능)
export function calculateDDay(targetDate: string | null | undefined): number | null {
  if (!targetDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
