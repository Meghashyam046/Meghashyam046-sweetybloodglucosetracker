import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReadingForm from './ReadingForm';
import { GlucoseReading } from '../types';

const TODAY = '2026-10-15';

function makeReading(
  overrides: Partial<GlucoseReading> = {}
): GlucoseReading {
  return {
    id: 'r-1',
    userId: 'u-1',
    date: TODAY,
    slot: 'morning_fasting',
    value: 98,
    createdAt: '2026-10-15T08:00:00.000Z',
    updatedAt: '2026-10-15T08:00:00.000Z',
    ...overrides,
  };
}

describe('ReadingForm', () => {
  it('shows error when glucose value is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ReadingForm
        initialDate={TODAY}
        today={TODAY}
        existingReadings={[]}
        onSubmit={onSubmit}
      />
    );

    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a glucose value.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects out-of-range or decimal glucose values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ReadingForm
        initialDate={TODAY}
        today={TODAY}
        existingReadings={[]}
        onSubmit={onSubmit}
      />
    );

    const valueInput = screen.getByLabelText(/glucose value/i);
    await user.type(valueInput, '35');
    await user.click(screen.getByRole('button', { name: /save reading/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );

    await user.clear(valueInput);
    await user.type(valueInput, '125.5');
    await user.click(screen.getByRole('button', { name: /save reading/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );

    await user.clear(valueInput);
    await user.type(valueInput, '650');
    await user.click(screen.getByRole('button', { name: /save reading/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Value must be between 40 and 600 mg/dl.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects duplicate slot on the same date', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ReadingForm
        initialDate={TODAY}
        today={TODAY}
        existingReadings={[makeReading({ slot: 'after_lunch' })]}
        onSubmit={onSubmit}
      />
    );

    await user.selectOptions(
      screen.getByLabelText(/time slot/i),
      'after_lunch'
    );
    await user.type(screen.getByLabelText(/glucose value/i), '142');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You already have an After lunch reading for this date.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects adding more than 4 readings on the same date', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    const fullDay: GlucoseReading[] = [
      makeReading({ id: '1', slot: 'morning_fasting' }),
      makeReading({ id: '2', slot: 'after_breakfast' }),
      makeReading({ id: '3', slot: 'after_lunch' }),
      makeReading({ id: '4', slot: 'after_dinner' }),
    ];

    render(
      <ReadingForm
        initialDate={TODAY}
        today={TODAY}
        existingReadings={fullDay}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/glucose value/i), '110');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You can add only 4 readings per day.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a future date', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <ReadingForm
        initialDate={TODAY}
        today={TODAY}
        existingReadings={[]}
        onSubmit={onSubmit}
      />
    );

    const dateInput = screen.getByLabelText(/date/i);
    await user.clear(dateInput);
    await user.type(dateInput, '2026-10-16');
    await user.type(screen.getByLabelText(/glucose value/i), '118');
    await user.click(screen.getByRole('button', { name: /save reading/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Date cannot be in the future.'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid reading and allows editing existing slot without duplicate error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existing = makeReading({
      id: 'edit-1',
      slot: 'after_breakfast',
      value: 135,
    });

    render(
      <ReadingForm
        editingReading={existing}
        today={TODAY}
        existingReadings={[existing]}
        onSubmit={onSubmit}
      />
    );

    const valueInput = screen.getByLabelText(/glucose value/i);
    await user.clear(valueInput);
    await user.type(valueInput, '128');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      date: TODAY,
      slot: 'after_breakfast',
      value: 128,
    });
  });
});
