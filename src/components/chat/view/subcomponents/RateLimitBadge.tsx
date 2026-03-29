import { useEffect, useRef, useState } from 'react';
import { api } from '../../../../utils/api';

type UsageWindow = {
  utilization: number;
  resets_at: string | null;
};

type ExtraUsage = {
  is_enabled: boolean;
  utilization: number;
  used_credits: number;
  monthly_limit: number;
};

type UsageData = {
  five_hour: UsageWindow;
  seven_day: UsageWindow;
  extra_usage?: ExtraUsage;
};

function formatResetTime(iso: string | null, style: 'time' | 'datetime' = 'time'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const opts: Intl.DateTimeFormatOptions =
    style === 'time'
      ? { hour: 'numeric', minute: '2-digit' }
      : { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  return d.toLocaleString(undefined, opts).toLowerCase();
}

function pctColor(pct: number): string {
  if (pct >= 90) return 'text-red-500 dark:text-red-400';
  if (pct >= 70) return 'text-yellow-500 dark:text-yellow-400';
  if (pct >= 50) return 'text-orange-500 dark:text-orange-400';
  return 'text-green-500 dark:text-green-400';
}

function barBgColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  if (pct >= 50) return 'bg-orange-500';
  return 'bg-green-500';
}

function UsageBar({ pct, label, reset }: { pct: number; label: string; reset: string }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-3 text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold ${pctColor(clamped)}`}>{clamped}%</span>
          {reset && <span className="text-muted-foreground/70">⟳ {reset}</span>}
        </div>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barBgColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

const STORAGE_KEY = 'rate-limit-usage';

function loadCachedUsage(): UsageData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as UsageData;
  } catch (_) {
    // ignore
  }
  return null;
}

function saveCachedUsage(data: UsageData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // ignore
  }
}

export default function RateLimitBadge() {
  const [data, setData] = useState<UsageData | null>(loadCachedUsage);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const failCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout>;

    async function fetchUsage() {
      try {
        const res = await api.claudeUsage();
        if (!res.ok) {
          console.warn('[RateLimitBadge] API returned', res.status, await res.text().catch(() => ''));
          failCountRef.current++;
          scheduleNext();
          return;
        }
        const json = (await res.json()) as UsageData;
        if (!cancelled) {
          setData(json);
          saveCachedUsage(json);
          failCountRef.current = 0;
        }
      } catch (err) {
        console.warn('[RateLimitBadge] Fetch error:', err);
        failCountRef.current++;
      }
      scheduleNext();
    }

    function scheduleNext() {
      if (cancelled) return;
      // Normal polling: 5 min. On failure: 30s, 60s, then cap at 60s
      const delay = failCountRef.current === 0
        ? 300_000
        : Math.min(60_000, 30_000 * failCountRef.current);
      timerId = setTimeout(fetchUsage, delay);
    }

    void fetchUsage();
    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!data) return null;

  const fivePct = Math.round(data.five_hour?.utilization ?? 0);
  const sevenPct = Math.round(data.seven_day?.utilization ?? 0);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-colors ${
          open
            ? 'border-border bg-accent'
            : 'border-border/50 bg-transparent hover:bg-accent/50'
        }`}
        title="Claude rate limit usage"
      >
        <div className="flex flex-col items-center leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">5H</span>
          <span className={`text-[11px] font-semibold ${pctColor(fivePct)}`}>{fivePct}%</span>
        </div>
        <span className="text-border/60">|</span>
        <div className="flex flex-col items-center leading-none">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">7D</span>
          <span className={`text-[11px] font-semibold ${pctColor(sevenPct)}`}>{sevenPct}%</span>
        </div>
      </button>

      {open && (
        <div className="fixed bottom-24 left-3 right-3 z-[60] w-auto rounded-xl border border-border bg-card p-3 shadow-lg sm:absolute sm:bottom-full sm:left-1/2 sm:right-auto sm:z-auto sm:mb-2 sm:w-56 sm:-translate-x-1/2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Rate Limit Usage
          </p>
          <div className="flex flex-col gap-2">
            <UsageBar
              pct={fivePct}
              label="Current (5h)"
              reset={formatResetTime(data.five_hour?.resets_at ?? null, 'time')}
            />
            <UsageBar
              pct={sevenPct}
              label="Weekly (7d)"
              reset={formatResetTime(data.seven_day?.resets_at ?? null, 'datetime')}
            />
            {data.extra_usage?.is_enabled && (
              <UsageBar
                pct={Math.round(data.extra_usage.utilization ?? 0)}
                label={`Extra ($${((data.extra_usage.used_credits ?? 0) / 100).toFixed(2)}/$${((data.extra_usage.monthly_limit ?? 0) / 100).toFixed(2)})`}
                reset=""
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
