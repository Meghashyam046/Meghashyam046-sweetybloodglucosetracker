import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import {
  GlucoseReading,
  formatHumanDate,
  getGlucoseStatus,
  getSlotLabel,
} from '../types';

interface ReadingsHistoryProps {
  readings: GlucoseReading[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  readOnly?: boolean;
  onPageChange: (nextPage: number) => void;
  onEdit: (reading: GlucoseReading) => void;
  onDelete: (id: string) => Promise<void>;
  onAddReading: () => void;
}

const STATUS_TEXT_CLASS: Record<string, string> = {
  low: 'text-amber-700',
  normal: 'text-emerald-700',
  elevated: 'text-amber-700',
  high: 'text-red-700',
};

export default function ReadingsHistory({
  readings,
  pagination,
  loading,
  readOnly,
  onPageChange,
  onEdit,
  onDelete,
  onAddReading,
}: ReadingsHistoryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
        <p className="text-base font-semibold text-slate-900">
          No glucose readings yet
        </p>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Once readings are logged, your full chronological logbook will appear
          here with daily, month-to-date, and monthly summaries.
        </p>
        {!readOnly && (
          <button
            type="button"
            onClick={onAddReading}
            className="mt-2 px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
          >
            Log first reading
          </button>
        )}
      </div>
    );
  }

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.total,
    pagination.page * pagination.limit
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            All readings log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Showing {startItem}–{endItem} of {pagination.total} readings
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
              <th className="py-2.5 px-5">Date</th>
              <th className="py-2.5 px-5">Time slot</th>
              <th className="py-2.5 px-5 text-right">Glucose</th>
              <th className="py-2.5 px-5">Status</th>
              {!readOnly && <th className="py-2.5 px-5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {readings.map((r) => {
              const status = getGlucoseStatus(r.value);
              return (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-5 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                    {formatHumanDate(r.date)}
                  </td>
                  <td className="py-3 px-5 text-slate-900 font-medium whitespace-nowrap">
                    {getSlotLabel(r.slot)}
                  </td>
                  <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                    {r.value}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      mg/dl
                    </span>
                  </td>
                  <td className="py-3 px-5 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${STATUS_TEXT_CLASS[status.tone]}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      {confirmDeleteId === r.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => handleConfirmDelete(r.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md"
                          >
                            {deletingId === r.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            aria-label={`Edit reading on ${r.date}`}
                            className="p-1.5 text-slate-400 hover:text-teal-700 rounded-md"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(r.id)}
                            aria-label={`Delete reading on ${r.date}`}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 tabular-nums">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
