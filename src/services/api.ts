import {
  GlucoseReading,
  ReadingSlot,
  ReportsResponse,
  UserProfile,
  UserRole,
  getLocalTodayIso,
} from '../types';

export interface DoctorSummary {
  id: string;
  name: string;
  email: string;
}

export interface AssignedPatientSummary {
  id: string;
  name: string;
  email: string;
  readingCount: number;
  latestReading: GlucoseReading | null;
}

export interface PaginatedReadingsResponse {
  readings: GlucoseReading[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function getHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Local-Date': getLocalTodayIso(),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed.');
  }
  return data as T;
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  doctorEmail?: string;
}): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function fetchMe(
  token: string
): Promise<{ user: UserProfile; doctors: DoctorSummary[] }> {
  const res = await fetch('/api/auth/me', {
    headers: getHeaders(token),
  });
  return parseJson(res);
}

export async function updateAssignedDoctor(
  token: string,
  payload: { doctorId?: string | null; doctorEmail?: string | null }
): Promise<{ user: UserProfile }> {
  const res = await fetch('/api/auth/doctor', {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function fetchReadings(
  token: string,
  params: { page?: number; limit?: number; date?: string; month?: string; patientId?: string } = {}
): Promise<PaginatedReadingsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.date) qs.set('date', params.date);
  if (params.month) qs.set('month', params.month);
  if (params.patientId) qs.set('patientId', params.patientId);

  const res = await fetch(`/api/readings?${qs.toString()}`, {
    headers: getHeaders(token),
  });
  return parseJson(res);
}

export async function createReading(
  token: string,
  payload: { date: string; slot: ReadingSlot; value: number }
): Promise<{ reading: GlucoseReading }> {
  const res = await fetch('/api/readings', {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function updateReading(
  token: string,
  id: string,
  payload: { date: string; slot: ReadingSlot; value: number }
): Promise<{ reading: GlucoseReading }> {
  const res = await fetch(`/api/readings/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function deleteReading(
  token: string,
  id: string
): Promise<{ deletedId: string }> {
  const res = await fetch(`/api/readings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  return parseJson(res);
}

export async function fetchReports(
  token: string,
  date: string,
  patientId?: string
): Promise<ReportsResponse> {
  const qs = new URLSearchParams({ date });
  if (patientId) qs.set('patientId', patientId);

  const res = await fetch(`/api/reports?${qs.toString()}`, {
    headers: getHeaders(token),
  });
  return parseJson(res);
}

export async function fetchDoctorPatients(
  token: string
): Promise<{ patients: AssignedPatientSummary[] }> {
  const res = await fetch('/api/doctor/patients', {
    headers: getHeaders(token),
  });
  return parseJson(res);
}
