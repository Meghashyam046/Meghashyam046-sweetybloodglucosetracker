import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  GlucoseReading,
  formatHumanDayMonth,
  getSlotLabel,
} from '../types';

interface GlucoseChartProps {
  selectedDate: string;
  readings: GlucoseReading[];
}

export default function GlucoseChart({
  selectedDate,
  readings,
}: GlucoseChartProps) {
  const [year, month] = selectedDate.split('-').map(Number);
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleString(
    'en-US',
    { month: 'long', year: 'numeric', timeZone: 'UTC' }
  );

  const data = readings.map((r) => ({
    id: r.id,
    label: `${formatHumanDayMonth(r.date)} · ${getSlotLabel(r.slot)}`,
    shortDate: formatHumanDayMonth(r.date),
    slot: getSlotLabel(r.slot),
    value: r.value,
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Monthly glucose trend
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {monthLabel} · Target range 70–140 mg/dl
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>70 mg/dl low</span>
          <span aria-hidden="true">·</span>
          <span>140 mg/dl target</span>
          <span aria-hidden="true">·</span>
          <span>180 mg/dl high</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center px-4">
          <p className="text-sm font-medium text-slate-700">
            No readings in {monthLabel}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Log readings during this month to visualize your blood glucose trend
            over time.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
            >
              <defs>
                <linearGradient id="sweetyGlucoseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                minTickGap={24}
              />
              <YAxis
                domain={[40, 'auto']}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
                }}
                formatter={(val: any) => [`${val} mg/dl`, 'Glucose']}
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload?.label || ''
                }
              />
              <ReferenceLine
                y={70}
                stroke="#d97706"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
              />
              <ReferenceLine
                y={140}
                stroke="#0f766e"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              <ReferenceLine
                y={180}
                stroke="#dc2626"
                strokeDasharray="4 4"
                strokeOpacity={0.55}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0f766e"
                strokeWidth={2}
                fill="url(#sweetyGlucoseFill)"
                dot={{ r: 3, fill: '#0f766e', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
