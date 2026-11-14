export type ReadingSlot =
  | 'morning_fasting'
  | 'after_breakfast'
  | 'after_lunch'
  | 'after_dinner';

export type UserRole = 'patient' | 'doctor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  assignedDoctorEmail?: string | null;
  token?: string;
}

export interface GlucoseReading {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  slot: ReadingSlot;
  value: number; // mg/dl, whole integer 40..600
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  rangeLabel: string;
  startDate: string;
  endDate: string;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
}

export interface DailyReport extends ReportSummary {
  readings: GlucoseReading[];
}

export interface ReportsResponse {
  selectedDate: string;
  daily: DailyReport;
  monthToDate: ReportSummary;
  monthly: ReportSummary;
  chartReadings: GlucoseReading[];
}

export const SLOT_OPTIONS: ReadonlyArray<{
  value: ReadingSlot;
  label: string;
  shortLabel: string;
  order: number;
  article: 'a' | 'an';
}> = [
  {
    value: 'morning_fasting',
    label: 'Morning (fasting)',
    shortLabel: 'Morning',
    order: 0,
    article: 'a',
  },
  {
    value: 'after_breakfast',
    label: 'After breakfast',
    shortLabel: 'Breakfast',
    order: 1,
    article: 'an',
  },
  {
    value: 'after_lunch',
    label: 'After lunch',
    shortLabel: 'Lunch',
    order: 2,
    article: 'an',
  },
  {
    value: 'after_dinner',
    label: 'After dinner',
    shortLabel: 'Dinner',
    order: 3,
    article: 'an',
  },
];

export const VALID_SLOTS = new Set<ReadingSlot>(SLOT_OPTIONS.map((s) => s.value));

export function getSlotOption(slot: ReadingSlot) {
  return SLOT_OPTIONS.find((s) => s.value === slot) || SLOT_OPTIONS[0];
}

export function getSlotLabel(slot: ReadingSlot): string {
  return getSlotOption(slot).label;
}

export function getSlotOrder(slot: ReadingSlot): number {
  return getSlotOption(slot).order;
}

export function getDuplicateSlotMessage(slot: ReadingSlot): string {
  const opt = getSlotOption(slot);
  return `You already have ${opt.article} ${opt.label} reading for this date.`;
}

export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function getLocalTodayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface ReadingValidationInput {
  date: string;
  slot: ReadingSlot | string;
  value: string | number | null | undefined;
}

export interface ReadingValidationOptions {
  today?: string;
  editingReadingId?: string;
}

export interface ReadingValidationResult {
  valid: boolean;
  error?: string;
  parsedValue?: number;
}

export function validateReadingInput(
  input: ReadingValidationInput,
  existingReadings: Pick<GlucoseReading, 'id' | 'date' | 'slot'>[],
  options: ReadingValidationOptions = {}
): ReadingValidationResult {
  const today = options.today || getLocalTodayIso();
  const date = typeof input.date === 'string' ? input.date.trim() : '';

  if (!date || !isValidIsoDate(date)) {
    return { valid: false, error: 'Please select a valid date.' };
  }

  if (date > today) {
    return { valid: false, error: 'Date cannot be in the future.' };
  }

  if (!VALID_SLOTS.has(input.slot as ReadingSlot)) {
    return { valid: false, error: 'Please select a valid time slot.' };
  }
  const slot = input.slot as ReadingSlot;

  const rawValue = input.value;
  if (
    rawValue === undefined ||
    rawValue === null ||
    (typeof rawValue === 'string' && rawValue.trim() === '')
  ) {
    return { valid: false, error: 'Please enter a glucose value.' };
  }

  const trimmedStr = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue);
  if (!/^-?\d+(\.\d+)?$/.test(trimmedStr)) {
    return { valid: false, error: 'Value must be between 40 and 600 mg/dl.' };
  }

  const parsed = Number(trimmedStr);
  if (!Number.isInteger(parsed) || parsed < 40 || parsed > 600) {
    return { valid: false, error: 'Value must be between 40 and 600 mg/dl.' };
  }

  const readingsOnDate = existingReadings.filter(
    (r) => r.date === date && r.id !== options.editingReadingId
  );

  if (readingsOnDate.length >= 4) {
    return { valid: false, error: 'You can add only 4 readings per day.' };
  }

  if (readingsOnDate.some((r) => r.slot === slot)) {
    return { valid: false, error: getDuplicateSlotMessage(slot) };
  }

  return { valid: true, parsedValue: parsed };
}

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatHumanDate(dateStr: string): string {
  if (!isValidIsoDate(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_ABBR[m - 1]} ${y}`;
}

export function formatHumanDayMonth(dateStr: string): string {
  if (!isValidIsoDate(dateStr)) return dateStr;
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_ABBR[m - 1]}`;
}

export function getReportDateRanges(selectedDate: string) {
  const [year, month] = selectedDate.split('-').map(Number);
  const monthStr = String(month).padStart(2, '0');

  // Month-to-date: 1st of selected date's month to selectedDate
  const mtdStart = `${year}-${monthStr}-01`;
  const mtdEnd = selectedDate;
  const mtdLabel =
    mtdStart === mtdEnd
      ? formatHumanDate(mtdEnd)
      : `${formatHumanDayMonth(mtdStart)} – ${formatHumanDate(mtdEnd)}`;

  // Previous month: whole calendar month prior to selectedDate's month
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthStr = String(prevMonth).padStart(2, '0');
  const lastDayPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const prevStart = `${prevYear}-${prevMonthStr}-01`;
  const prevEnd = `${prevYear}-${prevMonthStr}-${String(lastDayPrevMonth).padStart(2, '0')}`;
  const prevLabel = `${formatHumanDayMonth(prevStart)} – ${formatHumanDate(prevEnd)}`;

  // Full selected month (for chart)
  const lastDaySelectedMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const selectedMonthStart = `${year}-${monthStr}-01`;
  const selectedMonthEnd = `${year}-${monthStr}-${String(lastDaySelectedMonth).padStart(2, '0')}`;

  return {
    daily: {
      startDate: selectedDate,
      endDate: selectedDate,
      rangeLabel: formatHumanDate(selectedDate),
    },
    monthToDate: {
      startDate: mtdStart,
      endDate: mtdEnd,
      rangeLabel: mtdLabel,
    },
    monthly: {
      startDate: prevStart,
      endDate: prevEnd,
      rangeLabel: prevLabel,
    },
    selectedMonth: {
      startDate: selectedMonthStart,
      endDate: selectedMonthEnd,
    },
  };
}

export function computeReportStats(readings: Pick<GlucoseReading, 'value'>[]): {
  highest: number | null;
  lowest: number | null;
  average: number | null;
  count: number;
} {
  if (readings.length === 0) {
    return { highest: null, lowest: null, average: null, count: 0 };
  }
  let highest = readings[0].value;
  let lowest = readings[0].value;
  let sum = 0;

  for (const r of readings) {
    if (r.value > highest) highest = r.value;
    if (r.value < lowest) lowest = r.value;
    sum += r.value;
  }

  const average = Math.round((sum / readings.length) * 10) / 10;
  return {
    highest,
    lowest,
    average,
    count: readings.length,
  };
}

export function buildReportsForDate(
  allReadings: GlucoseReading[],
  selectedDate: string
): ReportsResponse {
  const ranges = getReportDateRanges(selectedDate);

  const dailyReadings = allReadings
    .filter((r) => r.date === selectedDate)
    .sort((a, b) => getSlotOrder(a.slot) - getSlotOrder(b.slot));

  const mtdReadings = allReadings.filter(
    (r) => r.date >= ranges.monthToDate.startDate && r.date <= ranges.monthToDate.endDate
  );

  const prevMonthReadings = allReadings.filter(
    (r) => r.date >= ranges.monthly.startDate && r.date <= ranges.monthly.endDate
  );

  const chartReadings = allReadings
    .filter(
      (r) =>
        r.date >= ranges.selectedMonth.startDate &&
        r.date <= ranges.selectedMonth.endDate
    )
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return getSlotOrder(a.slot) - getSlotOrder(b.slot);
    });

  return {
    selectedDate,
    daily: {
      ...ranges.daily,
      ...computeReportStats(dailyReadings),
      readings: dailyReadings,
    },
    monthToDate: {
      ...ranges.monthToDate,
      ...computeReportStats(mtdReadings),
    },
    monthly: {
      ...ranges.monthly,
      ...computeReportStats(prevMonthReadings),
    },
    chartReadings,
  };
}

export interface GlucoseStatus {
  label: 'Low' | 'In range' | 'Elevated' | 'High';
  tone: 'low' | 'normal' | 'elevated' | 'high';
}

export function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < 70) {
    return { label: 'Low', tone: 'low' };
  }
  if (value <= 140) {
    return { label: 'In range', tone: 'normal' };
  }
  if (value <= 180) {
    return { label: 'Elevated', tone: 'elevated' };
  }
  return { label: 'High', tone: 'high' };
}
