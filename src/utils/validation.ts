export {
  SLOT_OPTIONS,
  VALID_SLOTS,
  getSlotOption,
  getSlotLabel,
  getSlotOrder,
  getDuplicateSlotMessage,
  isValidIsoDate,
  getLocalTodayIso,
  validateReadingInput,
  formatHumanDate,
  formatHumanDayMonth,
  getReportDateRanges,
  computeReportStats,
  buildReportsForDate,
  getGlucoseStatus,
} from '../../shared/glucose.ts';

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) return 'Please enter your email address.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Please enter your name.';
  if (name.trim().length > 100) return 'Name must be 100 characters or fewer.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Please enter a password.';
  if (password.length < 6) {
    return 'Password must be at least 6 characters long.';
  }
  return null;
}
