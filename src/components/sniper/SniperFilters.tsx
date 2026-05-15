'use client';

import { Verdict } from '@/types';

interface Filters {
  minLiquidity: number;
  verdict: Verdict | 'all';
  minScore: number;
  timeRange: '1h' | '6h' | '24h' | 'all';
}

export function SniperFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const verdictOptions: Array<{ value: Verdict | 'all'; label: string }> = [
    { value: 'all', label: 'ALL VERDICTS' },
    { value: 'BUY', label: '✓ BUY' },
    { value: 'WATCH', label: '◎ WATCH' },
    { value: 'AVOID', label: '✗ AVOID' },
  ];

  const timeOptions: Array<{ value: Filters['timeRange']; label: string }> = [
    { value: 'all', label: 'ALL TIME' },
    { value: '1h', label: 'LAST 1H' },
    { value: '6h', label: 'LAST 6H' },
    { value: '24h', label: 'LAST 24H' },
  ];

  const liquidityOptions = [
    { value: 0, label: 'ANY LIQ' },
    { value: 10000, label: '>$10K' },
    { value: 50000, label: '>$50K' },
    { value: 100000, label: '>$100K' },
    { value: 250000, label: '>$250K' },
  ];

  const scoreOptions = [
    { value: 0, label: 'ANY SCORE' },
    { value: 40, label: '>40' },
    { value: 60, label: '>60' },
    { value: 70, label: '>70' },
    { value: 80, label: '>80' },
  ];

  function FilterGroup<T extends string | number>({
    label,
    options,
    selected,
    onSelect,
  }: {
    label: string;
    options: Array<{ value: T; label: string }>;
    selected: T;
    onSelect: (v: T) => void;
  }) {
    return (
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em', marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {options.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => onSelect(opt.value)}
              style={{
                padding: '5px 10px',
                background: selected === opt.value ? 'var(--accent-primary)' : 'transparent',
                color: selected === opt.value ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: selected === opt.value ? 'var(--accent-primary)' : 'var(--border-default)',
                cursor: 'pointer',
                fontFamily: 'Bebas Neue',
                letterSpacing: '0.08em',
                fontSize: '0.78rem',
                transition: 'all 120ms ease',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-angular"
      style={{
        padding: '16px 20px',
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}
    >
      <FilterGroup
        label="VERDICT"
        options={verdictOptions}
        selected={filters.verdict}
        onSelect={v => onChange({ ...filters, verdict: v })}
      />
      <FilterGroup
        label="MIN LIQUIDITY"
        options={liquidityOptions}
        selected={filters.minLiquidity}
        onSelect={v => onChange({ ...filters, minLiquidity: v })}
      />
      <FilterGroup
        label="MIN AI SCORE"
        options={scoreOptions}
        selected={filters.minScore}
        onSelect={v => onChange({ ...filters, minScore: v })}
      />
      <FilterGroup
        label="TIME RANGE"
        options={timeOptions}
        selected={filters.timeRange}
        onSelect={v => onChange({ ...filters, timeRange: v })}
      />
    </div>
  );
}
