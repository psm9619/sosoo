'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface VoiceClonePolicyProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function VoiceClonePolicy({ onAccept, onDecline }: VoiceClonePolicyProps) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="space-y-6">
      {/* 정책 내용 */}
      <div className="bg-teal-light/30 border border-teal/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-teal"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h3 className="font-semibold text-charcoal">음성 데이터 보호 정책</h3>
        </div>

        <ul className="text-sm text-gray-warm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>
              <strong className="text-charcoal">개인정보 보호:</strong> 녹음된 음성은 암호화되어 안전하게 저장되며,
              오직 개선된 스피치 재생에만 사용됩니다.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>
              <strong className="text-charcoal">AI 학습 금지:</strong> 귀하의 음성 데이터는 AI 모델 학습에
              절대 사용되지 않습니다.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>
              <strong className="text-charcoal">서비스 내 사용:</strong> 복제된 음성은 VoiceUp 서비스 내에서만 재생되며,
              다운로드할 수 없습니다.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">✓</span>
            <span>
              <strong className="text-charcoal">삭제 권한:</strong> 언제든지 마이페이지에서 음성 클론을 삭제할 수 있으며,
              삭제 시 모든 관련 데이터가 영구 삭제됩니다.
            </span>
          </li>
        </ul>
      </div>

      {/* AI 방어 공지 */}
      <div className="bg-secondary rounded-xl p-4">
        <p className="text-sm text-gray-warm">
          <strong className="text-charcoal">AI 악용 방지:</strong> VoiceUp은 음성 복제 기술의 악용을 방지하기 위해
          본인 인증을 거친 사용자만 음성 클론을 사용할 수 있으며, 모든 사용 내역이 기록됩니다.
        </p>
      </div>

      {/* 동의 체크박스 */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-gray-300 text-teal focus:ring-teal cursor-pointer"
        />
        <span className="text-sm text-charcoal">
          위 음성 데이터 보호 정책을 읽었으며, 제 음성을 VoiceUp 서비스에서
          사용하는 것에 동의합니다.
        </span>
      </label>

      {/* 버튼 */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onDecline}
          className="flex-1"
        >
          나중에 하기
        </Button>
        <Button
          onClick={onAccept}
          disabled={!isChecked}
          className="flex-1 bg-teal hover:bg-teal-dark disabled:opacity-50"
        >
          동의하고 계속하기
        </Button>
      </div>
    </div>
  );
}
