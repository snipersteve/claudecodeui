import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus } from 'lucide-react';
import { DarkModeToggle, Button } from '../../../../shared/view/ui';
import type { CodeEditorSettingsState, ProjectSortOrder } from '../../types/types';
import LanguageSelector from '../../../../shared/view/ui/LanguageSelector';
import SettingsCard from '../SettingsCard';
import SettingsRow from '../SettingsRow';
import SettingsSection from '../SettingsSection';
import SettingsToggle from '../SettingsToggle';
import { api } from '../../../../utils/api';

type AppearanceSettingsTabProps = {
  projectSortOrder: ProjectSortOrder;
  onProjectSortOrderChange: (value: ProjectSortOrder) => void;
  codeEditorSettings: CodeEditorSettingsState;
  onCodeEditorThemeChange: (value: 'dark' | 'light') => void;
  onCodeEditorWordWrapChange: (value: boolean) => void;
  onCodeEditorShowMinimapChange: (value: boolean) => void;
  onCodeEditorLineNumbersChange: (value: boolean) => void;
  onCodeEditorFontSizeChange: (value: string) => void;
};

function ProjectScanPathsSection() {
  const { t } = useTranslation('settings');
  const [scanPaths, setScanPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadScanPaths = useCallback(async () => {
    try {
      const response = await api.get('/settings/project-scan-paths');
      if (response.ok) {
        const data = await response.json();
        setScanPaths(data.paths || []);
      }
    } catch (error) {
      console.error('Error loading scan paths:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScanPaths();
  }, [loadScanPaths]);

  const savePaths = useCallback(async (paths: string[]) => {
    try {
      const response = await api.put('/settings/project-scan-paths', { paths });
      if (response.ok) {
        const data = await response.json();
        setScanPaths(data.paths || []);
      }
    } catch (error) {
      console.error('Error saving scan paths:', error);
    }
  }, []);

  const handleAdd = useCallback(() => {
    const trimmed = newPath.trim();
    if (!trimmed || scanPaths.includes(trimmed)) return;
    const updated = [...scanPaths, trimmed];
    setScanPaths(updated);
    setNewPath('');
    void savePaths(updated);
  }, [newPath, scanPaths, savePaths]);

  const handleRemove = useCallback((index: number) => {
    const updated = scanPaths.filter((_, i) => i !== index);
    setScanPaths(updated);
    void savePaths(updated);
  }, [scanPaths, savePaths]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }, [handleAdd]);

  if (isLoading) return null;

  return (
    <SettingsSection title={t('appearanceSettings.projectScanPaths.label', 'Project Scan Paths')}>
      <SettingsCard>
        <div className="px-4 py-4">
          <div className="text-sm font-medium text-foreground">
            {t('appearanceSettings.projectScanPaths.label', 'Project Scan Paths')}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {t('appearanceSettings.projectScanPaths.description', 'Only show projects under these directories. Leave empty to show all projects.')}
          </div>

          {scanPaths.length > 0 && (
            <div className="mt-3 space-y-2">
              {scanPaths.map((p, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <code className="flex-1 truncate text-xs text-foreground">{p}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 flex-shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('appearanceSettings.projectScanPaths.placeholder', '/Users/username/Documents/git')}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3"
              onClick={handleAdd}
              disabled={!newPath.trim()}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t('appearanceSettings.projectScanPaths.add', 'Add')}
            </Button>
          </div>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

export default function AppearanceSettingsTab({
  projectSortOrder,
  onProjectSortOrderChange,
  codeEditorSettings,
  onCodeEditorThemeChange,
  onCodeEditorWordWrapChange,
  onCodeEditorShowMinimapChange,
  onCodeEditorLineNumbersChange,
  onCodeEditorFontSizeChange,
}: AppearanceSettingsTabProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-8">
      <SettingsSection title={t('appearanceSettings.darkMode.label')}>
        <SettingsCard>
          <SettingsRow
            label={t('appearanceSettings.darkMode.label')}
            description={t('appearanceSettings.darkMode.description')}
          >
            <DarkModeToggle ariaLabel={t('appearanceSettings.darkMode.label')} />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title={t('mainTabs.appearance')}>
        <SettingsCard>
          <LanguageSelector />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection title={t('appearanceSettings.projectSorting.label')}>
        <SettingsCard>
          <SettingsRow
            label={t('appearanceSettings.projectSorting.label')}
            description={t('appearanceSettings.projectSorting.description')}
          >
            <select
              value={projectSortOrder}
              onChange={(event) => onProjectSortOrderChange(event.target.value as ProjectSortOrder)}
              className="w-full rounded-lg border border-input bg-card p-2.5 text-sm text-foreground touch-manipulation focus:border-primary focus:ring-1 focus:ring-primary sm:w-36"
            >
              <option value="name">{t('appearanceSettings.projectSorting.alphabetical')}</option>
              <option value="date">{t('appearanceSettings.projectSorting.recentActivity')}</option>
            </select>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>

      <ProjectScanPathsSection />

      <SettingsSection title={t('appearanceSettings.codeEditor.title')}>
        <SettingsCard divided>
          <SettingsRow
            label={t('appearanceSettings.codeEditor.theme.label')}
            description={t('appearanceSettings.codeEditor.theme.description')}
          >
            <DarkModeToggle
              checked={codeEditorSettings.theme === 'dark'}
              onToggle={(enabled) => onCodeEditorThemeChange(enabled ? 'dark' : 'light')}
              ariaLabel={t('appearanceSettings.codeEditor.theme.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.wordWrap.label')}
            description={t('appearanceSettings.codeEditor.wordWrap.description')}
          >
            <SettingsToggle
              checked={codeEditorSettings.wordWrap}
              onChange={onCodeEditorWordWrapChange}
              ariaLabel={t('appearanceSettings.codeEditor.wordWrap.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.showMinimap.label')}
            description={t('appearanceSettings.codeEditor.showMinimap.description')}
          >
            <SettingsToggle
              checked={codeEditorSettings.showMinimap}
              onChange={onCodeEditorShowMinimapChange}
              ariaLabel={t('appearanceSettings.codeEditor.showMinimap.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.lineNumbers.label')}
            description={t('appearanceSettings.codeEditor.lineNumbers.description')}
          >
            <SettingsToggle
              checked={codeEditorSettings.lineNumbers}
              onChange={onCodeEditorLineNumbersChange}
              ariaLabel={t('appearanceSettings.codeEditor.lineNumbers.label')}
            />
          </SettingsRow>

          <SettingsRow
            label={t('appearanceSettings.codeEditor.fontSize.label')}
            description={t('appearanceSettings.codeEditor.fontSize.description')}
          >
            <select
              value={codeEditorSettings.fontSize}
              onChange={(event) => onCodeEditorFontSizeChange(event.target.value)}
              className="w-full rounded-lg border border-input bg-card p-2.5 text-sm text-foreground touch-manipulation focus:border-primary focus:ring-1 focus:ring-primary sm:w-28"
            >
              <option value="10">10px</option>
              <option value="11">11px</option>
              <option value="12">12px</option>
              <option value="13">13px</option>
              <option value="14">14px</option>
              <option value="15">15px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
            </select>
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </div>
  );
}
