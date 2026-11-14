import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  GlucoseReading,
  ReadingSlot,
  SLOT_OPTIONS,
  getLocalTodayIso,
} from '../types';
import { validateReadingInput } from '../utils/validation';

export interface ReadingFormProps {
  initialDate?: string;
  initialSlot?: ReadingSlot;
  editingReading?: GlucoseReading | null;
  existingReadings: Pick<GlucoseReading, 'id' | 'date' | 'slot'>[];
  today?: string;
  onSubmit: (payload: {
    date: string;
    slot: ReadingSlot;
    value: number;
  }) => Promise<void>;
  onCancel?: () => void;
}

export default function ReadingForm({
  initialDate,
  initialSlot,
  editingReading,
  existingReadings,
  today,
  onSubmit,
  onCancel,
}: ReadingFormProps) {
  const effectiveToday = today || getLocalTodayIso();
  const [date, setDate] = useState(
    editingReading?.date || initialDate || effectiveToday
  );
  const [slot, setSlot] = useState<ReadingSlot>(
    editingReading?.slot || initialSlot || 'morning_fasting'
  );
  const [value, setValue] = useState(
    editingReading ? String(editingReading.value) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.date);
      setSlot(editingReading.slot);
      setValue(String(editingReading.value));
    } else {
      if (initialDate) setDate(initialDate);
      if (initialSlot) setSlot(initialSlot);
      setValue('');
    }
    setError(null);
  }, [editingReading, initialDate, initialSlot]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = validateReadingInput(
      { date, slot, value },
      existingReadings,
      {
        today: effectiveToday,
        editingReadingId: editingReading?.id,
      }
    );

    if (!result.valid || result.parsedValue === undefined) {
      setError(result.error || 'Please check your input.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        date: date.trim(),
        slot,
        value: result.parsedValue,
      });
    } catch (err: any) {
      setError(err.message || 'Unable to save reading.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {editingReading ? 'Edit glucose reading' : 'Log glucose reading'}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close form"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div>
        <label
          htmlFor="reading-date"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Date
        </label>
        <input
          id="reading-date"
          type="date"
          max={effectiveToday}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            if (error) setError(null);
          }}
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 font-mono tabular-nums"
        />
      </div>

      <div>
        <label
          htmlFor="reading-slot"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Time slot
        </label>
        <select
          id="reading-slot"
          value={slot}
          onChange={(e) => {
            setSlot(e.target.value as ReadingSlot);
            if (error) setError(null);
          }}
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
        >
          {SLOT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="reading-value"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Glucose value (mg/dl)
        </label>
        <div className="relative">
          <input
            id="reading-value"
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. 112"
            className="w-full px-3.5 py-2.5 pr-16 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 font-mono tabular-nums"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono pointer-events-none">
            mg/dl
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          Enter a whole number between 40 and 600 mg/dl.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {editingReading ? 'Save changes' : 'Save reading'}
        </button>
      </div>
    </form>
  );
}
