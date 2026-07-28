'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DailyTrend {
  day: string;
  clicks: number;
}

interface AnalyticsChartProps {
  data: DailyTrend[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6500" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#FF6500" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="day"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0B192C',
              borderColor: 'rgba(255, 101, 0, 0.4)',
              borderRadius: '12px',
              color: '#F4F6F9',
              fontSize: '12px',
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#FF6500"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorClicks)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
