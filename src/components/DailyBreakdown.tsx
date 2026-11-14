import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  GlucoseReading,
  ReadingSlot,
  SLOT_OPTIONS,
  getGlucoseStatus,
} from '../types';

interface DailyBreakdownProps {
  selectedDate: string;
  rangeLabel: string;
  readings: GlucoseReading[];
  readOnly?: boolean;
  onAddForSlot: (slot: ReadingSlot) => void;
  onEdit: (reading: GlucoseReading) => void;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_TEXT_CLASS: Record<string, string> = {
  low: 'text-amber-700',
  normal: 'text-emerald-700',
  elevated: 'text-amber-700',
  high: 'text-red-700',
};

export default function DailyBreakdown({
  rangeLabel,
  readings,
  readOnly,
  onAddForSlot,
  onEdit,
  onDelete,
}: DailyBreakdownProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const bySlot = new Map<ReadingSlot, GlucoseReading>();
  for (const r of readings) {
    bySlot.set(r.slot, r);
  }

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
      setConfirmDeleteId(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Daily readings by slot
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {rangeLabel} · {readings.length} of 4 slots logged
          </p>
        </div>
      </div>

      {readings.length === 0 && (
        <div className="py-4 px-1 text-sm text-slate-500 border-b border-slate-100">
          No readings recorded on {rangeLabel}. Select a slot below to log your
          first reading for this day.
        </div>
      )}

      <ul className="divide-y divide-slate-100">
        {SLOT_OPTIONS.map((slotOpt) => {
          const reading = bySlot.get(slotOpt.value);
          const status = reading ? getGlucoseStatus(reading.value) : null;

          return (
            <li
              key={slotOpt.value}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {slotOpt.label}
                </p>
                {reading && status ? (
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className={`font-medium ${STATUS_TEXT_CLASS[status.tone]}`}>
                      {status.label}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-0.5">Not logged</p>
                )}
              </div>

              {reading ? (
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-semibold text-slate-900 font-mono tabular-nums">
                    {reading.value}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      mg/dl
                    </span>
                  </span>

                  {!readOnly && (
                    <>
                      {confirmDeleteId === reading.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === reading.id}
                            onClick={() => handleConfirmDelete(reading.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors whitespace-nowrap"
                          >
                            {deletingId === reading.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(reading)}
                            aria-label={`Edit ${slotOpt.label} reading`}
                            className="p-1.5 text-slate-400 hover:text-teal-700 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(reading.id)}
                            aria-label={`Delete ${slotOpt.label} reading`}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                !readOnly && (
                  <button
                    type="button"
                    onClick={() => onAddForSlot(slotOpt.value)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Log
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
