'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import type { CategoryFeedback, CategoryEvaluation, SubcategoryEvaluation } from '@/types/api';

interface CategoryFeedbackViewProps {
  feedback: CategoryFeedback;
}

// 카테고리별 라벨
const CATEGORY_LABELS: Record<string, string> = {
  delivery: '전달력',
  structure: '구조력',
  content: '내용력',
  contextFit: '상황 적합성',
};

// 레벨별 스타일
const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: 'bg-teal-light/30', text: 'text-teal-dark', border: 'border-teal/30' },
  good: { bg: 'bg-teal-light/20', text: 'text-teal', border: 'border-teal/20' },
  average: { bg: 'bg-secondary', text: 'text-gray-warm', border: 'border-border' },
  needs_improvement: { bg: 'bg-coral-light/20', text: 'text-coral', border: 'border-coral/20' },
};

// 상태별 스타일
const STATUS_STYLES: Record<string, { dot: string; text: string }> = {
  good: { dot: 'bg-teal', text: 'text-charcoal' },
  warning: { dot: 'bg-amber-500', text: 'text-charcoal' },
  bad: { dot: 'bg-coral', text: 'text-charcoal' },
};

export function CategoryFeedbackView({ feedback }: CategoryFeedbackViewProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (key: string) => {
    setExpandedCategory(expandedCategory === key ? null : key);
  };

  return (
    <div className="space-y-4">
      {/* 1. 한 줄 평가 */}
      <Card className="px-4 py-3 sm:px-5 sm:py-4 bg-secondary/50 border-none">
        <p className="text-sm sm:text-base text-charcoal font-medium text-center leading-relaxed">
          {feedback.summary}
        </p>
      </Card>

      {/* 2. 카테고리별 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {(Object.entries(feedback.categories) as [string, CategoryEvaluation][]).map(([key, category]) => {
          const label = CATEGORY_LABELS[key];
          const levelStyle = LEVEL_STYLES[category.level] || LEVEL_STYLES.average;
          const isExpanded = expandedCategory === key;

          return (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`p-3 sm:p-4 rounded-xl border transition-all text-left cursor-pointer group ${levelStyle.bg} ${levelStyle.border} ${
                isExpanded
                  ? 'ring-2 ring-teal/50 shadow-sm'
                  : 'hover:shadow-md hover:border-gray-soft/50'
              }`}
            >
              {/* 헤더: 카테고리명 + 레벨 + 화살표 */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-charcoal text-sm">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${levelStyle.text}`}>
                    {category.label}
                  </span>
                  {/* 펼침 화살표 */}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-gray-soft transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-teal' : 'group-hover:text-charcoal'
                    }`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* 서브카테고리 요약 (최대 3개) */}
              <div className="space-y-1.5">
                {category.subcategories.slice(0, 3).map((sub, idx) => {
                  const statusStyle = STATUS_STYLES[sub.status] || STATUS_STYLES.warning;
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${statusStyle.dot}`} />
                      <span className={`text-xs leading-relaxed ${statusStyle.text} line-clamp-1`}>
                        {sub.name}
                      </span>
                    </div>
                  );
                })}
              </div>
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
  const label = CATEGORY_LABELS[categoryKey];
  const levelStyle = LEVEL_STYLES[category.level] || LEVEL_STYLES.average;

  return (
    <Card className="p-4 sm:p-5 bg-warm-white border-none animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-charcoal text-sm sm:text-base">{label}</h3>
          <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs ${levelStyle.bg} ${levelStyle.text}`}>
            {category.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-soft hover:text-charcoal transition-colors p-1 hover:bg-secondary rounded"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {category.subcategories.map((sub, index) => (
          <SubcategoryRow key={index} subcategory={sub} />
        ))}
      </div>
    </Card>
  );
}

function SubcategoryRow({ subcategory }: { subcategory: SubcategoryEvaluation }) {
  const statusStyle = STATUS_STYLES[subcategory.status] || STATUS_STYLES.warning;

  return (
    <div className="flex items-start gap-2.5 p-2.5 sm:p-3 bg-cream rounded-lg">
      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusStyle.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-charcoal text-xs sm:text-sm">{subcategory.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            subcategory.status === 'good' ? 'bg-teal-light/30 text-teal-dark' :
            subcategory.status === 'warning' ? 'bg-amber-100 text-amber-700' :
            'bg-coral-light/30 text-coral'
          }`}>
            {subcategory.status === 'good' ? '양호' : subcategory.status === 'warning' ? '권장' : '필요'}
          </span>
        </div>
        <p className="text-xs text-gray-warm mt-1 leading-relaxed">{subcategory.feedback}</p>
        {subcategory.details && subcategory.details.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {subcategory.details.map((detail, i) => (
              <span key={i} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-gray-warm">
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
