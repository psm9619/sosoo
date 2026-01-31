'use client';

import { useMemo } from 'react';
import type { Question } from '@/types';

interface PrepChecklistProps {
  questions: Question[];
  targetDate: string | null | undefined;
  onQuestionClick?: (questionId: string) => void;
}

export function PrepChecklist({
  questions,
  targetDate,
  onQuestionClick,
}: PrepChecklistProps) {
  // D-Day까지 7일 이내인지 확인
  const isNearDeadline = useMemo(() => {
    if (!targetDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }, [targetDate]);

  // 질문별 완료 상태
  const checklistItems = useMemo(() => {
    return questions.map((question) => {
      const hasAttempts = question.attempts.length > 0;
      const bestScore = question.attempts.reduce((max, attempt) => {
        return Math.max(max, attempt.score || 0);
      }, 0);
      const isPracticed = hasAttempts;
      const isGoodScore = bestScore >= 70;

      return {
        id: question.id,
        text: question.text,
        category: question.category,
        isPracticed,
        isGoodScore,
        bestScore,
        attemptCount: question.attempts.length,
      };
    });
  }, [questions]);

  const completedCount = checklistItems.filter((item) => item.isPracticed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (!isNearDeadline || questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h3 className="font-semibold text-charcoal">준비 체크리스트</h3>
        </div>
        <span className="text-sm text-amber-700 font-medium">
          {completedCount}/{totalCount} 완료
        </span>
      </div>

      {/* 진행 바 */}
      <div className="w-full h-2 bg-amber-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* 체크리스트 */}
      <ul className="space-y-2">
        {checklistItems.map((item) => (
          <li
            key={item.id}
            className={`
              flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer
              ${item.isPracticed ? 'bg-white' : 'bg-amber-100/50 hover:bg-amber-100'}
            `}
            onClick={() => onQuestionClick?.(item.id)}
          >
            {/* 체크박스 */}
            <div
              className={`
                w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                ${item.isPracticed
                  ? item.isGoodScore
                    ? 'bg-teal text-white'
                    : 'bg-amber-500 text-white'
                  : 'border-2 border-amber-300'
                }
              `}
            >
              {item.isPracticed && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              )}
            </div>

            {/* 질문 텍스트 */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${item.isPracticed ? 'text-charcoal' : 'text-gray-warm'} line-clamp-1`}>
                {item.text}
              </p>
              {item.isPracticed && (
                <p className="text-xs text-gray-soft mt-0.5">
                  {item.attemptCount}회 연습 · 최고 {item.bestScore}점
                </p>
              )}
            </div>

            {/* 화살표 */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft flex-shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </li>
        ))}
      </ul>

      {/* 격려 메시지 */}
      {completedCount === totalCount && (
        <div className="mt-4 p-3 bg-teal-light/30 rounded-lg text-center">
          <p className="text-sm text-teal-dark font-medium">
            모든 질문을 연습했어요! 자신감을 가지세요 💪
          </p>
        </div>
      )}

      {completedCount < totalCount && completedCount > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-amber-700">
            {totalCount - completedCount}개 질문만 더 연습하면 완료!
          </p>
        </div>
      )}
    </div>
  );
}
