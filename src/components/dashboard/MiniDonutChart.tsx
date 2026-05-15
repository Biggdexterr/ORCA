'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function MiniDonutChart({ accuracy }: { accuracy: number }) {
  const data = [
    { name: 'Accurate', value: accuracy },
    { name: 'Inaccurate', value: 100 - accuracy },
  ];

  return (
    <div style={{ position: 'relative', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={70}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill="var(--signal-bull)" />
            <Cell fill="var(--border-default)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'IBM Plex Mono',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--signal-bull)',
            lineHeight: 1,
          }}
          className="tabular-nums"
        >
          {accuracy.toFixed(0)}%
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>
          WIN RATE
        </div>
      </div>
    </div>
  );
}
