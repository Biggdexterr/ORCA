'use client';

import { useState, useEffect } from 'react';

interface SettingsState {
  birdeyeApiKey: string;
  anthropicApiKey: string;
  telegramBotToken: string;
  wsUrl: string;
  minLiquidityAlert: number;
  minScoreAlert: number;
  alertVerdict: string[];
  telegramChatId: string;
}

const DEFAULT_SETTINGS: SettingsState = {
  birdeyeApiKey: '',
  anthropicApiKey: '',
  telegramBotToken: '',
  wsUrl: 'ws://localhost:3001',
  minLiquidityAlert: 50000,
  minScoreAlert: 70,
  alertVerdict: ['BUY'],
  telegramChatId: '',
};

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-angular p-6 space-y-4" style={{ background: 'var(--bg-surface)' }}>
      <div className="section-header mb-4">
        <span style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed, sans-serif' }}>
        {label}
      </label>
      {hint && <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Barlow Condensed, sans-serif' }}>{hint}</p>}
      {children}
    </div>
  );
}

function ApiInput({ value, onChange, placeholder, isPassword = true }: {
  value: string; onChange: (v: string) => void; placeholder: string; isPassword?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <input
        type={isPassword && !show ? 'password' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm font-mono bg-[var(--bg-elevated)] border border-[var(--border-default)] focus:border-[var(--border-accent)] outline-none transition-colors"
        style={{ color: 'var(--text-primary)', fontFamily: 'IBM Plex Mono, monospace' }}
      />
      {isPassword && (
        <button
          onClick={() => setShow(s => !s)}
          className="px-3 py-2 text-xs border border-[var(--border-default)] hover:border-[var(--border-accent)] transition-colors"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-elevated)', fontFamily: 'Barlow Condensed, sans-serif' }}
        >
          {show ? 'HIDE' : 'SHOW'}
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('orca-settings');
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch {}
    }
    const storedTheme = localStorage.getItem('orca-theme') as 'dark' | 'light' | 'system' | null;
    if (storedTheme) setTheme(storedTheme);
  }, []);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings(s => ({ ...s, [key]: value }));
  }

  function toggleVerdict(v: string) {
    setSettings(s => ({
      ...s,
      alertVerdict: s.alertVerdict.includes(v)
        ? s.alertVerdict.filter(x => x !== v)
        : [...s.alertVerdict, v],
    }));
  }

  function handleSave() {
    localStorage.setItem('orca-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function applyTheme(t: 'dark' | 'light' | 'system') {
    setTheme(t);
    localStorage.setItem('orca-theme', t);
    const html = document.documentElement;
    if (t === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.className = isDark ? 'theme-dark' : 'theme-light';
    } else {
      html.className = `theme-${t}`;
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-widest uppercase"
            style={{ fontFamily: 'Bebas Neue, sans-serif', color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed, sans-serif' }}>
          Configure API keys, notifications, and display preferences
        </p>
      </div>

      {/* Theme */}
      <SettingSection title="Display">
        <SettingRow label="Color Theme" hint="Controls the visual appearance of the platform">
          <div className="flex gap-0">
            {(['light', 'system', 'dark'] as const).map(t => (
              <button
                key={t}
                onClick={() => applyTheme(t)}
                className="px-4 py-2 text-xs font-mono tracking-wider transition-all flex-1"
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  background: theme === t ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: theme === t ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {t === 'light' ? '☀ LIGHT' : t === 'system' ? '⚙ SYSTEM' : '🌑 DARK'}
              </button>
            ))}
          </div>
        </SettingRow>
      </SettingSection>

      {/* API Keys */}
      <SettingSection title="API Keys">
        <SettingRow
          label="Birdeye API Key"
          hint="Required for live token data and wallet tracking. Get at birdeye.so"
        >
          <ApiInput value={settings.birdeyeApiKey} onChange={v => update('birdeyeApiKey', v)} placeholder="YOUR_BIRDEYE_API_KEY" />
        </SettingRow>
        <SettingRow
          label="Anthropic API Key"
          hint="Required for AI token analysis. Get at console.anthropic.com"
        >
          <ApiInput value={settings.anthropicApiKey} onChange={v => update('anthropicApiKey', v)} placeholder="sk-ant-..." />
        </SettingRow>
        <SettingRow
          label="Telegram Bot Token"
          hint="Required for alert notifications. Create via @BotFather on Telegram"
        >
          <ApiInput value={settings.telegramBotToken} onChange={v => update('telegramBotToken', v)} placeholder="12345:ABC..." />
        </SettingRow>
        <SettingRow
          label="Telegram Chat ID"
          hint="Your Telegram user ID or group chat ID for alerts"
        >
          <ApiInput value={settings.telegramChatId} onChange={v => update('telegramChatId', v)} placeholder="-100123456789" isPassword={false} />
        </SettingRow>
        <SettingRow
          label="WebSocket URL"
          hint="ORCA real-time server URL"
        >
          <ApiInput value={settings.wsUrl} onChange={v => update('wsUrl', v)} placeholder="ws://localhost:3001" isPassword={false} />
        </SettingRow>
      </SettingSection>

      {/* Alert Filters */}
      <SettingSection title="Alert Filters">
        <SettingRow label="Minimum Liquidity for Alerts" hint="Only alert on tokens above this liquidity threshold (USD)">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10000}
              max={500000}
              step={10000}
              value={settings.minLiquidityAlert}
              onChange={e => update('minLiquidityAlert', Number(e.target.value))}
              className="flex-1 accent-[var(--accent-primary)]"
            />
            <span className="font-mono text-sm w-24 text-right" style={{ color: 'var(--accent-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>
              ${settings.minLiquidityAlert.toLocaleString()}
            </span>
          </div>
        </SettingRow>

        <SettingRow label="Minimum AI Score for Alerts" hint="Only alert on tokens scoring above this threshold">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.minScoreAlert}
              onChange={e => update('minScoreAlert', Number(e.target.value))}
              className="flex-1 accent-[var(--accent-primary)]"
            />
            <span className="font-mono text-sm w-16 text-right" style={{ color: 'var(--accent-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {settings.minScoreAlert}/100
            </span>
          </div>
        </SettingRow>

        <SettingRow label="Alert Verdict Types" hint="Which AI verdicts should trigger alerts">
          <div className="flex gap-2">
            {['BUY', 'WATCH', 'AVOID'].map(v => (
              <button
                key={v}
                onClick={() => toggleVerdict(v)}
                className="px-4 py-2 text-xs font-mono tracking-wider transition-all"
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  background: settings.alertVerdict.includes(v) ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                  color: settings.alertVerdict.includes(v) ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: `1px solid ${settings.alertVerdict.includes(v) ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </SettingRow>
      </SettingSection>

      {/* Info card */}
      <div className="p-4 border-l-4 text-sm" style={{
        borderColor: 'var(--signal-alert)',
        background: 'var(--bg-surface)',
        color: 'var(--text-secondary)',
        fontFamily: 'Barlow Condensed, sans-serif',
      }}>
        <strong style={{ color: 'var(--signal-alert)' }}>NOTE:</strong> API keys stored in localStorage are for development convenience only.
        For production, set them via environment variables in your .env file. See <code className="font-mono text-xs">docs/SETUP.md</code> for details.
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn-angular px-8 py-3 font-bold tracking-widest"
          style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: '1rem',
            background: saved ? 'var(--signal-bull)' : 'var(--accent-primary)',
            color: 'var(--text-inverse)',
          }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(4deg)' }}>
            {saved ? '✓ SAVED' : 'SAVE SETTINGS'}
          </span>
        </button>
      </div>
    </div>
  );
}
