import { type ReactNode, useMemo } from 'react';
import { Clock, Folder, MessageSquare, Search } from 'lucide-react';
import type { TFunction } from 'i18next';
import { cn } from '../../../../lib/utils';
import { ScrollArea } from '../../../../shared/view/ui';
import type { Project } from '../../../../types/app';

import type { ConversationSearchResults, SearchProgress } from '../../hooks/useSidebarController';
import { getSessionDate, createSessionViewModel } from '../../utils/utils';
import { formatTimeAgo } from '../../../../utils/dateUtils';
import SessionProviderLogo from '../../../llm-logo-provider/SessionProviderLogo';

import SidebarHeader from './SidebarHeader';
import SidebarProjectList, { type SidebarProjectListProps } from './SidebarProjectList';

type SearchMode = 'projects' | 'conversations';

function HighlightedSnippet({ snippet, highlights }: { snippet: string; highlights: { start: number; end: number }[] }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const h of highlights) {
    if (h.start > cursor) {
      parts.push(snippet.slice(cursor, h.start));
    }
    parts.push(
      <mark key={h.start} className="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-800">
        {snippet.slice(h.start, h.end)}
      </mark>
    );
    cursor = h.end;
  }
  if (cursor < snippet.length) {
    parts.push(snippet.slice(cursor));
  }
  return (
    <span className="text-xs leading-relaxed text-muted-foreground">
      {parts}
    </span>
  );
}

type SidebarContentProps = {
  isPWA: boolean;
  isMobile: boolean;
  isLoading: boolean;
  projects: Project[];
  searchFilter: string;
  onSearchFilterChange: (value: string) => void;
  onClearSearchFilter: () => void;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  conversationResults: ConversationSearchResults | null;
  isSearching: boolean;
  searchProgress: SearchProgress | null;
  onConversationResultClick: (projectName: string, sessionId: string, provider: string, messageTimestamp?: string | null, messageSnippet?: string | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onCreateProject: () => void;
  onCollapseSidebar: () => void;
  onShowSettings: () => void;
  projectListProps: SidebarProjectListProps;
  t: TFunction;
};

export default function SidebarContent({
  isPWA,
  isMobile,
  isLoading,
  projects,
  searchFilter,
  onSearchFilterChange,
  onClearSearchFilter,
  searchMode,
  onSearchModeChange,
  conversationResults,
  isSearching,
  searchProgress,
  onConversationResultClick,
  onRefresh,
  isRefreshing,
  onCreateProject,
  onCollapseSidebar,
  onShowSettings,
  projectListProps,
  t,
}: SidebarContentProps) {
  const showConversationSearch = searchMode === 'conversations' && searchFilter.trim().length >= 2;
  const hasPartialResults = conversationResults && conversationResults.results.length > 0;

  // Flat reverse-chronological session list for conversations mode
  const flatSessionList = useMemo(() => {
    if (searchMode !== 'conversations') return [];
    const all = projects.flatMap(project =>
      projectListProps.getProjectSessions(project).map(session => ({ session, project }))
    );
    all.sort((a, b) => getSessionDate(b.session).getTime() - getSessionDate(a.session).getTime());
    const q = searchFilter.trim().toLowerCase();
    if (!q) return all;
    return all.filter(({ session, project: p }) => {
      const name = (session.summary || session.name || '').toLowerCase();
      const proj = (p.displayName || p.name).toLowerCase();
      return name.includes(q) || proj.includes(q);
    });
  }, [searchMode, projects, projectListProps.getProjectSessions, searchFilter]);

  return (
    <div
      className="flex h-full flex-col bg-background/80 backdrop-blur-sm md:w-72 md:select-none"
      style={{}}
    >
      <SidebarHeader
        isPWA={isPWA}
        isMobile={isMobile}
        isLoading={isLoading}
        projectsCount={projects.length}
        searchFilter={searchFilter}
        onSearchFilterChange={onSearchFilterChange}
        onClearSearchFilter={onClearSearchFilter}
        searchMode={searchMode}
        onSearchModeChange={onSearchModeChange}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        onCreateProject={onCreateProject}
        onCollapseSidebar={onCollapseSidebar}
        onShowSettings={onShowSettings}
        t={t}
      />

      <ScrollArea className="flex-1 overflow-y-auto overscroll-contain md:px-1.5 md:py-2">
        {showConversationSearch ? (
          isSearching && !hasPartialResults ? (
            <div className="px-4 py-12 text-center md:py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted md:mb-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground">{t('search.searching')}</p>
              {searchProgress && (
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {t('search.projectsScanned', { count: searchProgress.scannedProjects })}/{searchProgress.totalProjects}
                </p>
              )}
            </div>
          ) : !isSearching && conversationResults && conversationResults.results.length === 0 ? (
            <div className="px-4 py-12 text-center md:py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted md:mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-base font-medium text-foreground md:mb-1">{t('search.noResults')}</h3>
              <p className="text-sm text-muted-foreground">{t('search.tryDifferentQuery')}</p>
            </div>
          ) : hasPartialResults ? (
            <div className="space-y-3 px-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground">
                  {t('search.matches', { count: conversationResults.totalMatches })}
                </p>
                {isSearching && searchProgress && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-muted-foreground/40 border-t-primary" />
                    <p className="text-[10px] text-muted-foreground/60">
                      {searchProgress.scannedProjects}/{searchProgress.totalProjects}
                    </p>
                  </div>
                )}
              </div>
              {isSearching && searchProgress && (
                <div className="mx-1 h-0.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-300"
                    style={{ width: `${Math.round((searchProgress.scannedProjects / searchProgress.totalProjects) * 100)}%` }}
                  />
                </div>
              )}
              {conversationResults.results.map((projectResult) => (
                <div key={projectResult.projectName} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    <Folder className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium text-foreground">
                      {projectResult.projectDisplayName}
                    </span>
                  </div>
                  {projectResult.sessions.map((session) => (
                    <button
                      key={`${projectResult.projectName}-${session.sessionId}`}
                      className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/50"
                      onClick={() => onConversationResultClick(
                        projectResult.projectName,
                        session.sessionId,
                        session.provider || session.matches[0]?.provider || 'claude',
                        session.matches[0]?.timestamp,
                        session.matches[0]?.snippet
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3 flex-shrink-0 text-primary" />
                        <span className="truncate text-xs font-medium text-foreground">
                          {session.sessionSummary}
                        </span>
                        {session.provider && session.provider !== 'claude' && (
                          <span className="flex-shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] uppercase text-muted-foreground">
                            {session.provider}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 pl-4">
                        {session.matches.map((match, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <span className="mt-0.5 flex-shrink-0 text-[10px] font-medium uppercase text-muted-foreground/60">
                              {match.role === 'user' ? 'U' : 'A'}
                            </span>
                            <HighlightedSnippet
                              snippet={match.snippet}
                              highlights={match.highlights}
                            />
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null
        ) : searchMode === 'conversations' ? (
          flatSessionList.length === 0 ? (
            <div className="px-4 py-12 text-center md:py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted md:mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('projects.noSessions', { defaultValue: 'No conversations yet' })}</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-1.5 py-2">
              {flatSessionList.map(({ session, project }) => {
                const sessionView = createSessionViewModel(session, projectListProps.currentTime, t);
                const isSelected = projectListProps.selectedSession?.id === session.id;
                return (
                  <button
                    key={`${project.name}-${session.id}`}
                    className={cn(
                      'group relative w-full rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-accent/50',
                      isSelected && 'bg-accent text-accent-foreground',
                    )}
                    onClick={() => projectListProps.onSessionSelect(session, project.name)}
                  >
                    {sessionView.isActive && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2">
                        <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                      </span>
                    )}
                    <div className="flex items-start gap-2">
                      <SessionProviderLogo provider={session.__provider} className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-foreground">{sessionView.sessionName}</div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <Folder className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/50" />
                          <span className="truncate text-[10px] text-muted-foreground/70">{project.displayName || project.name}</span>
                          <span className="text-[10px] text-muted-foreground/40">·</span>
                          <Clock className="h-2.5 w-2.5 flex-shrink-0 text-muted-foreground/50" />
                          <span className="text-[10px] text-muted-foreground/70">{formatTimeAgo(sessionView.sessionTime, projectListProps.currentTime, t)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <SidebarProjectList {...projectListProps} />
        )}
      </ScrollArea>

    </div>
  );
}
