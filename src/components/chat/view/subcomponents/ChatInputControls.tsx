import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PermissionMode, Provider } from '../../types/types';
import ThinkingModeSelector from './ThinkingModeSelector';
import TokenUsagePie from './TokenUsagePie';
import RateLimitBadge from './RateLimitBadge';
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS, GEMINI_MODELS } from '../../../../../shared/modelConstants';

interface ChatInputControlsProps {
  permissionMode: PermissionMode | string;
  onModeSwitch: () => void;
  provider: Provider | string;
  thinkingMode: string;
  setThinkingMode: React.Dispatch<React.SetStateAction<string>>;
  tokenBudget: { used?: number; total?: number } | null;
  slashCommandsCount: number;
  onToggleCommandMenu: () => void;
  hasInput: boolean;
  onClearInput: () => void;
  isUserScrolledUp: boolean;
  hasMessages: boolean;
  onScrollToBottom: () => void;
}

export default function ChatInputControls({
  permissionMode,
  onModeSwitch,
  provider,
  thinkingMode,
  setThinkingMode,
  tokenBudget,
  slashCommandsCount,
  onToggleCommandMenu,
  hasInput,
  onClearInput,
  isUserScrolledUp,
  hasMessages,
  onScrollToBottom,
}: ChatInputControlsProps) {
  const { t } = useTranslation('chat');

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {provider === 'claude' && (
        <ThinkingModeSelector selectedMode={thinkingMode} onModeChange={setThinkingMode} onClose={() => {}} className="" />
      )}

      <TokenUsagePie used={tokenBudget?.used || 0} total={tokenBudget?.total || parseInt(import.meta.env.VITE_CONTEXT_WINDOW) || 160000} />
      {provider === 'claude' && <RateLimitBadge />}

      {(() => {
        const keyMap: Record<string, string> = { claude: 'claude-model', cursor: 'cursor-model', codex: 'codex-model', gemini: 'gemini-model' };
        const defaultMap: Record<string, string> = { claude: CLAUDE_MODELS.DEFAULT, cursor: CURSOR_MODELS.DEFAULT, codex: CODEX_MODELS.DEFAULT, gemini: GEMINI_MODELS.DEFAULT };
        const allOptions = [...CLAUDE_MODELS.OPTIONS, ...CURSOR_MODELS.OPTIONS, ...CODEX_MODELS.OPTIONS, ...GEMINI_MODELS.OPTIONS];
        const key = keyMap[provider];
        if (!key) return null;
        const value = localStorage.getItem(key) || defaultMap[provider];
        const label = allOptions.find((o) => o.value === value)?.label || value;
        return (
          <span className="rounded-md border border-border/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/80">
            {label}
          </span>
        );
      })()}

      {hasInput && (
        <button
          type="button"
          onClick={onClearInput}
          className="group flex h-7 w-7 items-center justify-center rounded-lg border border-border/50 bg-card shadow-sm transition-all duration-200 hover:bg-accent/60 sm:h-8 sm:w-8"
          title={t('input.clearInput', { defaultValue: 'Clear input' })}
        >
          <svg
            className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-foreground sm:h-4 sm:w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {isUserScrolledUp && hasMessages && (
        <button
          onClick={onScrollToBottom}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:bg-primary/90 sm:h-8 sm:w-8"
          title={t('input.scrollToBottom', { defaultValue: 'Scroll to bottom' })}
        >
          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}
