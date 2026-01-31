'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import type { Project } from '@/types';

interface GrowthSummaryProps {
  project: Project;
}

export function GrowthSummary({ project }: GrowthSummaryProps) {
  const stats = useMemo(() => {
    const allAttempts = project.questions.flatMap((q) => q.attempts);
    const attemptsWithScores = allAttempts.filter((a) => a.score !== undefined);

    if (attemptsWithScores.length === 0) {
      return null;
    }

    // 전체 통계
    const totalAttempts = attemptsWithScores.length;
    const avgScore = Math.round(
      attemptsWithScores.reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
    );
    const maxScore = Math.max(...attemptsWithScores.map((a) => a.score || 0));
    const minScore = Math.min(...attemptsWithScores.map((a) => a.score || 0));

    // 시간순 정렬
    const sortedAttempts = [...attemptsWithScores].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // 첫 5회 vs 마지막 5회 비교 (5회 이상일 때)
    let improvement = null;
    if (sortedAttempts.length >= 5) {
      const firstFive = sortedAttempts.slice(0, 5);
      const lastFive = sortedAttempts.slice(-5);
      const firstAvg = firstFive.reduce((sum, a) => sum + (a.score || 0), 0) / 5;
      const lastAvg = lastFive.reduce((sum, a) => sum + (a.score || 0), 0) / 5;
      improvement = {
        firstAvg: Math.round(firstAvg),
        lastAvg: Math.round(lastAvg),
        diff: Math.round(lastAvg - firstAvg),
      };
    }

    // 질문별 성과
    const questionStats = project.questions
      .filter((q) => q.attempts.length > 0)
      .map((q) => {
        const scores = q.attempts.map((a) => a.score || 0);
        return {
          questionId: q.id,
          text: q.text,
          attemptCount: q.attempts.length,
          bestScore: Math.max(...scores),
          latestScore: scores[scores.length - 1],
          trend:
            scores.length >= 2
              ? scores[scores.length - 1] - scores[0]
              : 0,
        };
      });

    // 가장 성장한 질문
    const mostImproved = questionStats
      .filter((q) => q.attemptCount >= 2)
      .sort((a, b) => b.trend - a.trend)[0];

    // 가장 많이 연습한 질문
    const mostPracticed = [...questionStats].sort(
      (a, b) => b.attemptCount - a.attemptCount
    )[0];

    // 총 연습 시간
    const totalDuration = allAttempts.reduce((sum, a) => sum + (a.duration || 0), 0);

    // 연속 연습 일수 (간단한 계산)
    const uniqueDays = new Set(
      sortedAttempts.map((a) =>
        new Date(a.createdAt).toISOString().split('T')[0]
      )
    ).size;

    return {
      totalAttempts,
      avgScore,
      maxScore,
      minScore,
      improvement,
      mostImproved,
      mostPracticed,
      totalDuration,
      uniqueDays,
      questionsWithAttempts: questionStats.length,
      totalQuestions: project.questions.length,
    };
  }, [project]);

  if (!stats) {
    return (
      <Card className="p-6 bg-warm-white border-none">
        <div className="text-center text-gray-warm py-4">
          <p className="text-sm">연습 기록이 생기면 성장 분석을 볼 수 있어요</p>
        </div>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
  };

  return (
    <div className="space-y-4">
      {/* 성장 요약 카드 */}
      {stats.improvement && (
        <Card
          className={`p-5 border ${
            stats.improvement.diff > 0
              ? 'bg-teal-light/20 border-teal/20'
              : stats.improvement.diff < 0
              ? 'bg-coral-light/20 border-coral/20'
              : 'bg-warm-white border-none'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center
                ${stats.improvement.diff > 0 ? 'bg-teal/10' : stats.improvement.diff < 0 ? 'bg-coral/10' : 'bg-secondary'}
              `}
            >
              {stats.improvement.diff > 0 ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                  <path d="M7 17l5-5 5 5" />
                  <path d="M7 12l5-5 5 5" />
                </svg>
              ) : stats.improvement.diff < 0 ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral">
                  <path d="M17 7l-5 5-5-5" />
                  <path d="M17 12l-5 5-5-5" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-warm">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-warm mb-1">처음 5회 대비 최근 5회</p>
              <p className="text-2xl font-bold text-charcoal">
                {stats.improvement.diff > 0 && '+'}
                {stats.improvement.diff}점
              </p>
              <p className="text-xs text-gray-soft">
                {stats.improvement.firstAvg}점 → {stats.improvement.lastAvg}점
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 통계 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 bg-warm-white border-none text-center">
          <p className="text-2xl font-bold text-charcoal">{stats.totalAttempts}</p>
          <p className="text-xs text-gray-warm">총 연습 횟수</p>
        </Card>
        <Card className="p-4 bg-warm-white border-none text-center">
          <p className="text-2xl font-bold text-teal">{stats.avgScore}</p>
          <p className="text-xs text-gray-warm">평균 점수</p>
        </Card>
        <Card className="p-4 bg-warm-white border-none text-center">
          <p className="text-2xl font-bold text-coral">{stats.maxScore}</p>
          <p className="text-xs text-gray-warm">최고 점수</p>
        </Card>
        <Card className="p-4 bg-warm-white border-none text-center">
          <p className="text-2xl font-bold text-charcoal">{formatDuration(stats.totalDuration)}</p>
          <p className="text-xs text-gray-warm">총 연습 시간</p>
        </Card>
      </div>

      {/* 질문별 인사이트 */}
      <Card className="p-5 bg-warm-white border-none">
        <h4 className="text-sm font-medium text-charcoal mb-4">연습 인사이트</h4>
        <div className="space-y-3">
          {/* 진행률 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-warm">질문 연습 진행률</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full"
                  style={{
                    width: `${(stats.questionsWithAttempts / stats.totalQuestions) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-charcoal">
                {stats.questionsWithAttempts}/{stats.totalQuestions}
              </span>
            </div>
          </div>

          {/* 가장 성장한 질문 */}
          {stats.mostImproved && stats.mostImproved.trend > 0 && (
            <div className="flex items-start gap-3 pt-3 border-t border-border">
              <div className="w-8 h-8 rounded-lg bg-teal-light/50 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-teal font-medium mb-1">가장 성장한 질문</p>
                <p className="text-sm text-charcoal line-clamp-1">{stats.mostImproved.text}</p>
                <p className="text-xs text-gray-soft">
                  +{stats.mostImproved.trend}점 상승 ({stats.mostImproved.attemptCount}회 연습)
                </p>
              </div>
            </div>
          )}

          {/* 가장 많이 연습한 질문 */}
          {stats.mostPracticed && stats.mostPracticed.attemptCount >= 3 && (
            <div className="flex items-start gap-3 pt-3 border-t border-border">
              <div className="w-8 h-8 rounded-lg bg-coral-light/50 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-coral font-medium mb-1">가장 많이 연습한 질문</p>
                <p className="text-sm text-charcoal line-clamp-1">{stats.mostPracticed.text}</p>
                <p className="text-xs text-gray-soft">
                  {stats.mostPracticed.attemptCount}회 연습 (최고 {stats.mostPracticed.bestScore}점)
                </p>
              </div>
            </div>
          )}

          {/* 연습 일수 */}
          {stats.uniqueDays >= 2 && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm text-gray-warm">연습한 날</span>
              <span className="text-sm font-medium text-charcoal">{stats.uniqueDays}일</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
