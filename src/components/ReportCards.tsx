import React from 'react';
import { ReportSummary, ReportsResponse } from '../types';

interface ReportCardsProps {
  reports: ReportsResponse | null;
  loading: boolean;
  readOnly?: boolean;
  onAddReading: () => void;
}

function SingleReportCard({
  title,
  report,
  readOnly,
  onAddReading,
}: {
  title: string;
  report: ReportSummary;
  readOnly?: boolean;
  onAddReading: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
            {report.rangeLabel}
          </span>
        </div>

        {report.count === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-slate-500">
              No readings recorded for this period.
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={onAddReading}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2"
              >
                Log a reading
              </button>
            )}
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs text-slate-500">Average</p>
                <p className="text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight mt-0.5">
                  {report.average?.toFixed(1)}
                  <span className="text-xs font-normal text-slate-500 ml-1">
                    mg/dl
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Readings</p>
                <p className="text-lg font-semibold text-slate-800 font-mono tabular-nums mt-0.5">
                  {report.count}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Highest</p>
                <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                  {report.highest} mg/dl
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Lowest</p>
                <p className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                  {report.lowest} mg/dl
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportCards({
  reports,
  loading,
  readOnly,
  onAddReading,
}: ReportCardsProps) {
  if (loading || !reports) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-200 rounded-xl p-5 h-44 animate-pulse"
          >
            <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
            <div className="h-8 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <SingleReportCard
        title="Daily report"
        report={reports.daily}
        readOnly={readOnly}
        onAddReading={onAddReading}
      />
      <SingleReportCard
        title="Month-to-date"
        report={reports.monthToDate}
        readOnly={readOnly}
        onAddReading={onAddReading}
      />
      <SingleReportCard
        title="Monthly (previous)"
        report={reports.monthly}
        readOnly={readOnly}
        onAddReading={onAddReading}
      />
    </div>
  );
}
