'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { Attempt } from '@/types';

interface DataPoint {
  date: string;
  score: number;
  attemptIndex: number;
  formattedDate: string;
}

interface ScoreChartProps {
  attempts: Attempt[];
  height?: number;
  showGrid?: boolean;
  color?: 'teal' | 'coral';
}

export function ScoreChart({
  attempts,
  height = 200,
  showGrid = true,
  color = 'teal',
}: ScoreChartProps) {
  const dataPoints = useMemo<DataPoint[]>(() => {
    return attempts
      .filter((a) => a.score !== undefined)
      .map((attempt, index) => ({
        date: attempt.createdAt,
        score: attempt.score || 0,
        attemptIndex: index + 1,
        formattedDate: new Intl.DateTimeFormat('ko-KR', {
          month: 'short',
          day: 'numeric',
        }).format(new Date(attempt.createdAt)),
      }));
  }, [attempts]);

  if (dataPoints.length < 2) {
    return (
      <Card className="p-6 bg-warm-white border-none">
        <div className="text-center text-gray-warm py-8">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-3 text-gray-soft"
          >
            <path d="M3 3v18h18" />
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
          </svg>
          <p className="text-sm">2회 이상 연습하면 점수 변화를 확인할 수 있어요</p>
        </div>
      </Card>
    );
  }

  const maxScore = Math.max(...dataPoints.map((d) => d.score));
  const minScore = Math.min(...dataPoints.map((d) => d.score));
  const scoreRange = maxScore - minScore || 20; // 최소 범위 20점
  const paddedMin = Math.max(0, minScore - 10);
  const paddedMax = Math.min(100, maxScore + 10);
  const chartRange = paddedMax - paddedMin;

  // SVG path 계산
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = 100; // 퍼센트 기준
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    const usableWidth = chartWidth - ((padding.left + padding.right) / 4);
    return padding.left / 4 + (index / (dataPoints.length - 1)) * usableWidth;
  };

  const getY = (score: number) => {
    const normalizedScore = (score - paddedMin) / chartRange;
    return padding.top + chartHeight * (1 - normalizedScore);
  };

  // Path 생성
  const linePath = dataPoints
    .map((point, i) => {
      const x = getX(i);
      const y = getY(point.score);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Area fill path (그래프 아래 영역)
  const areaPath = `${linePath} L ${getX(dataPoints.length - 1)} ${height - padding.bottom} L ${getX(0)} ${height - padding.bottom} Z`;

  const colorClasses = {
    teal: {
      stroke: '#0D9488',
      fill: 'url(#tealGradient)',
      dot: 'fill-teal',
      dotRing: 'stroke-teal',
    },
    coral: {
      stroke: '#F97316',
      fill: 'url(#coralGradient)',
      dot: 'fill-coral',
      dotRing: 'stroke-coral',
    },
  };

  const colors = colorClasses[color];

  // Y축 눈금
  const yTicks = [paddedMin, (paddedMin + paddedMax) / 2, paddedMax].map((v) => Math.round(v));

  return (
    <Card className="p-6 bg-warm-white border-none">
      <h3 className="text-sm font-medium text-charcoal mb-4">점수 변화</h3>
      <div className="relative" style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="tealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0D9488" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0D9488" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="coralGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* 그리드 라인 */}
          {showGrid && yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left / 4}
                y1={getY(tick)}
                x2={100 - padding.right / 4}
                y2={getY(tick)}
                stroke="#e5e5e5"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left / 4 - 2}
                y={getY(tick)}
                fontSize="3"
                fill="#9CA3AF"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* 영역 채우기 */}
          <path d={areaPath} fill={colors.fill} />

          {/* 라인 */}
          <path
            d={linePath}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 데이터 포인트 */}
          {dataPoints.map((point, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(point.score)}
                r="1.5"
                fill="white"
                stroke={colors.stroke}
                strokeWidth="0.6"
              />
              {/* X축 레이블 */}
              {(i === 0 || i === dataPoints.length - 1 || dataPoints.length <= 5) && (
                <text
                  x={getX(i)}
                  y={height - 10}
                  fontSize="2.5"
                  fill="#9CA3AF"
                  textAnchor="middle"
                >
                  {point.formattedDate}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* 성장 표시 */}
        {dataPoints.length >= 2 && (
          <div className="absolute top-0 right-0">
            {(() => {
              const firstScore = dataPoints[0].score;
              const lastScore = dataPoints[dataPoints.length - 1].score;
              const diff = lastScore - firstScore;
              const isPositive = diff > 0;
              const isNegative = diff < 0;

              return (
                <span
                  className={`
                    inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                    ${isPositive
                      ? 'bg-teal-light/50 text-teal-dark'
                      : isNegative
                      ? 'bg-coral-light/50 text-coral'
                      : 'bg-secondary text-gray-warm'
                    }
                  `}
                >
                  {isPositive ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  ) : isNegative ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                  {Math.abs(diff)}점 {isPositive ? '상승' : isNegative ? '하락' : '유지'}
                </span>
              );
            })()}
          </div>
        )}
      </div>
    </Card>
  );
}
