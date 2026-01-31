'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { CategoryFeedback, CategoryEvaluation, SubcategoryEvaluation } from '@/types/api';

interface CategoryFeedbackViewProps {
  feedback: CategoryFeedback;
}

// 카테고리별 아이콘과 색상
const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  delivery: { icon: '🎙️', label: '전달력', color: 'teal' },
  structure: { icon: '🧱', label: '구조력', color: 'coral' },
  content: { icon: '📝', label: '내용력', color: 'teal' },
  contextFit: { icon: '🎯', label: '상황 적합성', color: 'coral' },
};

// 레벨별 스타일
const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: 'bg-teal-light/30', text: 'text-teal-dark', border: 'border-teal/30' },
  good: { bg: 'bg-teal-light/20', text: 'text-teal', border: 'border-teal/20' },
  average: { bg: 'bg-secondary', text: 'text-gray-warm', border: 'border-border' },
  needs_improvement: { bg: 'bg-coral-light/20', text: 'text-coral', border: 'border-coral/20' },
};

// 상태별 아이콘
const STATUS_ICONS: Record<string, string> = {
  good: '✓',
  warning: '⚠️',
  bad: '✗',
};

const STATUS_COLORS: Record<string, string> = {
  good: 'text-teal',
  warning: 'text-amber-600',
  bad: 'text-coral',
};

export function CategoryFeedbackView({ feedback }: CategoryFeedbackViewProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (key: string) => {
    setExpandedCategory(expandedCategory === key ? null : key);
  };

  return (
    <div className="space-y-4">
      {/* 1. 한 줄 평가 (Hero Section) */}
      <Card className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-teal/10 to-coral/10 border-none">
        <p className="text-sm sm:text-base text-charcoal font-medium text-center leading-relaxed">
          {feedback.summary}
        </p>
      </Card>

      {/* 2. 카테고리별 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {(Object.entries(feedback.categories) as [string, CategoryEvaluation][]).map(([key, category]) => {
          const config = CATEGORY_CONFIG[key];
          const levelStyle = LEVEL_STYLES[category.level] || LEVEL_STYLES.average;
          const isExpanded = expandedCategory === key;

          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`p-3 sm:p-4 rounded-xl border transition-all text-left cursor-pointer group ${levelStyle.bg} ${levelStyle.border} ${
                isExpanded
                  ? 'ring-2 ring-teal ring-offset-1 shadow-md'
                  : 'hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl">{config.icon}</span>
                  <span className="font-medium text-charcoal text-xs sm:text-sm">{config.label}</span>
                </div>
                {/* Chevron 아이콘 - 클릭 가능함을 표시 */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`text-gray-soft transition-transform duration-200 flex-shrink-0 ${
                    isExpanded ? 'rotate-180 text-teal' : 'group-hover:translate-y-0.5'
                  }`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
              <p className={`text-xs sm:text-sm font-semibold ${levelStyle.text}`}>
                {category.label}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-warm mt-1 line-clamp-1">
                {STATUS_ICONS[category.subcategories[0]?.status] || '•'} {category.highlight}
              </p>
              {/* 자세히 보기 힌트 */}
              <p className={`text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-medium transition-colors ${
                isExpanded ? 'text-teal' : 'text-gray-soft group-hover:text-teal'
              }`}>
                {isExpanded ? '접기 ↑' : '자세히 →'}
              </p>
            </button>
          );
        })}
      </div>

      {/* 3. 상세 피드백 (Expandable) */}
      {expandedCategory && (
        <CategoryDetailView
          categoryKey={expandedCategory}
          category={feedback.categories[expandedCategory as keyof typeof feedback.categories]}
          onClose={() => setExpandedCategory(null)}
        />
      )}
    </div>
  );
}

interface CategoryDetailViewProps {
  categoryKey: string;
  category: CategoryEvaluation;
  onClose: () => void;
}

function CategoryDetailView({ categoryKey, category, onClose }: CategoryDetailViewProps) {
  const config = CATEGORY_CONFIG[categoryKey];

  return (
    <Card className="p-4 sm:p-6 bg-warm-white border-none animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{config.icon}</span>
          <h3 className="font-semibold text-charcoal text-base sm:text-lg">{config.label}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${LEVEL_STYLES[category.level].bg} ${LEVEL_STYLES[category.level].text}`}>
            {category.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-soft hover:text-charcoal transition-colors p-1 hover:bg-secondary rounded-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {category.subcategories.map((sub, index) => (
          <SubcategoryRow key={index} subcategory={sub} />
        ))}
      </div>
    </Card>
  );
}

function SubcategoryRow({ subcategory }: { subcategory: SubcategoryEvaluation }) {
  const statusIcon = STATUS_ICONS[subcategory.status];
  const statusColor = STATUS_COLORS[subcategory.status];

  return (
    <div className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-cream rounded-lg">
      <span className={`text-base sm:text-lg ${statusColor} flex-shrink-0 mt-0.5`}>{statusIcon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="font-medium text-charcoal text-sm sm:text-base">{subcategory.name}</span>
          <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded ${
            subcategory.status === 'good' ? 'bg-teal-light/30 text-teal-dark' :
            subcategory.status === 'warning' ? 'bg-amber-100 text-amber-700' :
            'bg-coral-light/30 text-coral'
          }`}>
            {subcategory.status === 'good' ? 'Good' : subcategory.status === 'warning' ? '개선 권장' : '개선 필요'}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-gray-warm mt-1 leading-relaxed">{subcategory.feedback}</p>
        {subcategory.details && subcategory.details.length > 0 && (
          <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
            {subcategory.details.map((detail, i) => (
              <span key={i} className="text-[10px] sm:text-xs bg-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-gray-warm">
                {detail}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryFeedbackView;
