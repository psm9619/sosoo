/**
 * Admin 메트릭 조회 함수
 * 관리자 대시보드용 통계 쿼리
 */

import { createClient as createServerClient } from './server';

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalProjects: number;
  totalAttempts: number;
  avgAttemptsPerUser: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topQuestionCategories: {
    category: string;
    count: number;
  }[];
  recentActivity: {
    date: string;
    attempts: number;
    uniqueUsers: number;
  }[];
  // 코칭 효과 메트릭
  coachingEffectiveness: {
    // 동일 질문 3회+ 연습 후 점수 개선된 사용자 비율
    improvedAfter3Attempts: {
      total: number;
      improved: number;
      percentage: number;
    };
    // North Star: 5회 연습 후 20%+ 개선된 사용자 비율
    northStar: {
      total: number;
      achieved: number;
      percentage: number;
    };
    // 평균 점수 향상폭 (첫 시도 → 마지막 시도)
    avgScoreImprovement: number;
  };
  // 리텐션 메트릭
  retention: {
    d1: number;
    d7: number;
    d30: number;
  };
}

export interface UserSummary {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  projectCount: number;
  attemptCount: number;
  avgScore: number | null;
  lastActivityAt: string | null;
}

/**
 * 전체 메트릭 조회
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createServerClient();

  // 1. 사용자 수
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // 2. 프로젝트 수
  const { count: totalProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', false);

  // 3. 시도 수
  const { count: totalAttempts } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // 4. 활성 사용자 (최근 N일 내 시도한 사용자)
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: dailyActiveData } = await supabase
    .from('attempts')
    .select('user_id')
    .gte('created_at', dayAgo)
    .eq('status', 'completed');

  const { data: weeklyActiveData } = await supabase
    .from('attempts')
    .select('user_id')
    .gte('created_at', weekAgo)
    .eq('status', 'completed');

  const { data: monthlyActiveData } = await supabase
    .from('attempts')
    .select('user_id')
    .gte('created_at', monthAgo)
    .eq('status', 'completed');

  const dailyActive = new Set(dailyActiveData?.map(a => a.user_id) || []).size;
  const weeklyActive = new Set(weeklyActiveData?.map(a => a.user_id) || []).size;
  const monthlyActive = new Set(monthlyActiveData?.map(a => a.user_id) || []).size;

  // 5. 점수 분포
  const { data: scoresData } = await supabase
    .from('attempts')
    .select('score')
    .eq('status', 'completed')
    .not('score', 'is', null);

  const scoreRanges = [
    { range: '90-100', min: 90, max: 100, count: 0 },
    { range: '80-89', min: 80, max: 89, count: 0 },
    { range: '70-79', min: 70, max: 79, count: 0 },
    { range: '60-69', min: 60, max: 69, count: 0 },
    { range: '0-59', min: 0, max: 59, count: 0 },
  ];

  scoresData?.forEach(({ score }) => {
    const range = scoreRanges.find(r => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  // 6. 질문 카테고리 분포
  const { data: categoriesData } = await supabase
    .from('questions')
    .select('category')
    .not('category', 'is', null);

  const categoryCount: Record<string, number> = {};
  categoriesData?.forEach(({ category }) => {
    if (category) {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  });

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));

  // 7. 최근 7일 활동
  const recentActivity: AdminMetrics['recentActivity'] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const nextDateStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: dayData } = await supabase
      .from('attempts')
      .select('user_id')
      .gte('created_at', dateStr)
      .lt('created_at', nextDateStr)
      .eq('status', 'completed');

    recentActivity.push({
      date: dateStr,
      attempts: dayData?.length || 0,
      uniqueUsers: new Set(dayData?.map(a => a.user_id) || []).size,
    });
  }

  // 8. 코칭 효과 메트릭 계산
  // 질문별 시도 데이터 조회
  const { data: attemptsByQuestion } = await supabase
    .from('attempts')
    .select('question_id, user_id, score, created_at')
    .eq('status', 'completed')
    .not('score', 'is', null)
    .order('created_at', { ascending: true });

  // 질문별로 그룹화
  const questionAttempts: Record<string, { userId: string; score: number; createdAt: string }[]> = {};
  attemptsByQuestion?.forEach(a => {
    if (!questionAttempts[a.question_id]) {
      questionAttempts[a.question_id] = [];
    }
    questionAttempts[a.question_id].push({
      userId: a.user_id,
      score: a.score,
      createdAt: a.created_at,
    });
  });

  // 3회+ 연습 질문에서 점수 개선된 비율
  let questionsWith3Plus = 0;
  let questionsImproved = 0;
  let totalScoreImprovement = 0;
  let improvementCount = 0;

  // North Star: 5회 연습 후 20%+ 개선
  let questionsWith5Plus = 0;
  let questionsWithNorthStar = 0;

  Object.values(questionAttempts).forEach(attempts => {
    if (attempts.length >= 3) {
      questionsWith3Plus++;
      const firstScore = attempts[0].score;
      const lastScore = attempts[attempts.length - 1].score;
      if (lastScore > firstScore) {
        questionsImproved++;
      }
      totalScoreImprovement += lastScore - firstScore;
      improvementCount++;
    }

    if (attempts.length >= 5) {
      questionsWith5Plus++;
      const firstScore = attempts[0].score;
      const lastScore = attempts[attempts.length - 1].score;
      const improvementRate = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;
      if (improvementRate >= 20) {
        questionsWithNorthStar++;
      }
    }
  });

  const coachingEffectiveness = {
    improvedAfter3Attempts: {
      total: questionsWith3Plus,
      improved: questionsImproved,
      percentage: questionsWith3Plus > 0 ? Math.round((questionsImproved / questionsWith3Plus) * 100) : 0,
    },
    northStar: {
      total: questionsWith5Plus,
      achieved: questionsWithNorthStar,
      percentage: questionsWith5Plus > 0 ? Math.round((questionsWithNorthStar / questionsWith5Plus) * 100) : 0,
    },
    avgScoreImprovement: improvementCount > 0 ? Math.round(totalScoreImprovement / improvementCount) : 0,
  };

  // 9. 리텐션 메트릭 계산
  // 가입 후 D1, D7, D30에 다시 활동한 사용자 비율
  const { data: usersWithSignup } = await supabase
    .from('users')
    .select('id, created_at');

  let d1Retained = 0;
  let d7Retained = 0;
  let d30Retained = 0;
  let d1Eligible = 0;
  let d7Eligible = 0;
  let d30Eligible = 0;

  const userAttemptDates: Record<string, Set<string>> = {};
  attemptsByQuestion?.forEach(a => {
    if (!userAttemptDates[a.user_id]) {
      userAttemptDates[a.user_id] = new Set();
    }
    userAttemptDates[a.user_id].add(a.created_at.split('T')[0]);
  });

  usersWithSignup?.forEach(user => {
    const signupDate = new Date(user.created_at);
    const userDates = userAttemptDates[user.id] || new Set();

    // D1 (가입 다음날 활동)
    const d1Date = new Date(signupDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    if (d1Date < now) {
      d1Eligible++;
      const d1Str = d1Date.toISOString().split('T')[0];
      if (userDates.has(d1Str)) {
        d1Retained++;
      }
    }

    // D7 (가입 7일 후 활동)
    const d7Date = new Date(signupDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (d7Date < now) {
      d7Eligible++;
      // D7 전후 2일 이내 활동 체크
      for (let i = -2; i <= 2; i++) {
        const checkDate = new Date(d7Date.getTime() + i * 24 * 60 * 60 * 1000);
        if (userDates.has(checkDate.toISOString().split('T')[0])) {
          d7Retained++;
          break;
        }
      }
    }

    // D30 (가입 30일 후 활동)
    const d30Date = new Date(signupDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (d30Date < now) {
      d30Eligible++;
      // D30 전후 3일 이내 활동 체크
      for (let i = -3; i <= 3; i++) {
        const checkDate = new Date(d30Date.getTime() + i * 24 * 60 * 60 * 1000);
        if (userDates.has(checkDate.toISOString().split('T')[0])) {
          d30Retained++;
          break;
        }
      }
    }
  });

  const retention = {
    d1: d1Eligible > 0 ? Math.round((d1Retained / d1Eligible) * 100) : 0,
    d7: d7Eligible > 0 ? Math.round((d7Retained / d7Eligible) * 100) : 0,
    d30: d30Eligible > 0 ? Math.round((d30Retained / d30Eligible) * 100) : 0,
  };

  return {
    totalUsers: totalUsers || 0,
    activeUsers: {
      daily: dailyActive,
      weekly: weeklyActive,
      monthly: monthlyActive,
    },
    totalProjects: totalProjects || 0,
    totalAttempts: totalAttempts || 0,
    avgAttemptsPerUser: (totalUsers || 0) > 0 ? (totalAttempts || 0) / (totalUsers || 1) : 0,
    scoreDistribution: scoreRanges.map(r => ({ range: r.range, count: r.count })),
    topQuestionCategories: topCategories,
    recentActivity,
    coachingEffectiveness,
    retention,
  };
}

/**
 * 사용자 목록 조회
 */
export async function getUsers(
  options: {
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'attempt_count' | 'avg_score';
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<{ users: UserSummary[]; total: number }> {
  const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = options;
  const supabase = await createServerClient();

  const offset = (page - 1) * limit;

  // 사용자 조회
  const { data: users, count } = await supabase
    .from('users')
    .select('id, email, display_name, created_at', { count: 'exact' })
    .order(sortBy === 'created_at' ? 'created_at' : 'created_at', { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (!users) {
    return { users: [], total: 0 };
  }

  // 각 사용자의 통계 조회
  const userIds = users.map(u => u.id);

  // 프로젝트 수
  const { data: projectCounts } = await supabase
    .from('projects')
    .select('user_id')
    .in('user_id', userIds)
    .eq('is_archived', false);

  // 시도 수 및 평균 점수
  const { data: attemptStats } = await supabase
    .from('attempts')
    .select('user_id, score, created_at')
    .in('user_id', userIds)
    .eq('status', 'completed');

  // 통계 집계
  const projectCountByUser: Record<string, number> = {};
  const attemptCountByUser: Record<string, number> = {};
  const scoresByUser: Record<string, number[]> = {};
  const lastActivityByUser: Record<string, string> = {};

  projectCounts?.forEach(({ user_id }) => {
    projectCountByUser[user_id] = (projectCountByUser[user_id] || 0) + 1;
  });

  attemptStats?.forEach(({ user_id, score, created_at }) => {
    attemptCountByUser[user_id] = (attemptCountByUser[user_id] || 0) + 1;
    if (score !== null) {
      if (!scoresByUser[user_id]) scoresByUser[user_id] = [];
      scoresByUser[user_id].push(score);
    }
    if (!lastActivityByUser[user_id] || created_at > lastActivityByUser[user_id]) {
      lastActivityByUser[user_id] = created_at;
    }
  });

  const userSummaries: UserSummary[] = users.map(u => ({
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    createdAt: u.created_at,
    projectCount: projectCountByUser[u.id] || 0,
    attemptCount: attemptCountByUser[u.id] || 0,
    avgScore: scoresByUser[u.id]?.length
      ? Math.round(scoresByUser[u.id].reduce((a, b) => a + b, 0) / scoresByUser[u.id].length)
      : null,
    lastActivityAt: lastActivityByUser[u.id] || null,
  }));

  return {
    users: userSummaries,
    total: count || 0,
  };
}

/**
 * 특정 사용자 상세 조회
 */
export async function getUserDetail(userId: string): Promise<{
  user: UserSummary;
  projects: { id: string; title: string; type: string; attemptCount: number; createdAt: string }[];
  recentAttempts: { id: string; questionText: string; score: number; createdAt: string }[];
} | null> {
  const supabase = await createServerClient();

  // 사용자 기본 정보
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, display_name, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return null;
  }

  // 프로젝트 목록
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, type, created_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  // 프로젝트별 시도 수
  const projectIds = projects?.map(p => p.id) || [];
  const { data: questions } = await supabase
    .from('questions')
    .select('id, project_id')
    .in('project_id', projectIds);

  const questionIds = questions?.map(q => q.id) || [];
  const { data: attempts } = await supabase
    .from('attempts')
    .select('id, question_id')
    .in('question_id', questionIds);

  const attemptCountByProject: Record<string, number> = {};
  questions?.forEach(q => {
    const count = attempts?.filter(a => a.question_id === q.id).length || 0;
    attemptCountByProject[q.project_id] = (attemptCountByProject[q.project_id] || 0) + count;
  });

  // 최근 시도 목록
  const { data: recentAttempts } = await supabase
    .from('attempts')
    .select('id, question_id, score, created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  // 질문 텍스트 조회
  const attemptQuestionIds = recentAttempts?.map(a => a.question_id) || [];
  const { data: attemptQuestions } = await supabase
    .from('questions')
    .select('id, text')
    .in('id', attemptQuestionIds);

  const questionTextMap: Record<string, string> = {};
  attemptQuestions?.forEach(q => {
    questionTextMap[q.id] = q.text;
  });

  // 사용자 통계 계산
  const allAttempts = await supabase
    .from('attempts')
    .select('score')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const scores = allAttempts.data?.filter(a => a.score !== null).map(a => a.score!) || [];
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at,
      projectCount: projects?.length || 0,
      attemptCount: attempts?.length || 0,
      avgScore,
      lastActivityAt: recentAttempts?.[0]?.created_at || null,
    },
    projects: projects?.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      attemptCount: attemptCountByProject[p.id] || 0,
      createdAt: p.created_at,
    })) || [],
    recentAttempts: recentAttempts?.map(a => ({
      id: a.id,
      questionText: questionTextMap[a.question_id] || '(삭제된 질문)',
      score: a.score || 0,
      createdAt: a.created_at,
    })) || [],
  };
}
