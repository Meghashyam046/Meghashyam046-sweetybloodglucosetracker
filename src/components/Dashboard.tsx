import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, LogOut, Plus, UserCheck } from 'lucide-react';
import {
  AssignedPatientSummary,
  DoctorSummary,
  createReading,
  deleteReading,
  fetchDoctorPatients,
  fetchMe,
  fetchReadings,
  fetchReports,
  updateAssignedDoctor,
  updateReading,
} from '../services/api';
import {
  GlucoseReading,
  ReadingSlot,
  ReportsResponse,
  UserProfile,
  formatHumanDate,
  getLocalTodayIso,
} from '../types';
import ReportCards from './ReportCards';
import DailyBreakdown from './DailyBreakdown';
import GlucoseChart from './GlucoseChart';
import ReadingsHistory from './ReadingsHistory';
import ReadingForm from './ReadingForm';

interface DashboardProps {
  currentUser: UserProfile;
  token: string;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function Dashboard({
  currentUser,
  token,
  onUserUpdated,
  onLogout,
}: DashboardProps) {
  const today = getLocalTodayIso();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'care'>(
    'overview'
  );

  // Doctor state
  const isDoctor = currentUser.role === 'doctor';
  const [patients, setPatients] = useState<AssignedPatientSummary[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null
  );

  // Patient care-team state
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [doctorEmailInput, setDoctorEmailInput] = useState(
    currentUser.assignedDoctorEmail || ''
  );
  const [doctorStatusMsg, setDoctorStatusMsg] = useState<string | null>(null);
  const [doctorErrorMsg, setDoctorErrorMsg] = useState<string | null>(null);
  const [savingDoctor, setSavingDoctor] = useState(false);

  // Readings & Reports state
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [historyReadings, setHistoryReadings] = useState<GlucoseReading[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [allOwnReadingsForValidation, setAllOwnReadingsForValidation] =
    useState<GlucoseReading[]>([]);
  const [bannerError, setBannerError] = useState<string | null>(null);

  // Modal state for Add / Edit reading
  const [formOpen, setFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<GlucoseReading | null>(
    null
  );
  const [prefillSlot, setPrefillSlot] = useState<ReadingSlot | undefined>(
    undefined
  );

  const effectiveTargetPatientId = isDoctor ? selectedPatientId : undefined;

  const loadMeta = useCallback(async () => {
    try {
      const meRes = await fetchMe(token);
      onUserUpdated({ ...meRes.user, token });
      setDoctors(meRes.doctors);
      setDoctorEmailInput(meRes.user.assignedDoctorEmail || '');

      if (meRes.user.role === 'doctor') {
        const pRes = await fetchDoctorPatients(token);
        setPatients(pRes.patients);
        if (pRes.patients.length > 0) {
          setSelectedPatientId((prev) => prev || pRes.patients[0].id);
        }
      }
    } catch (err: any) {
      setBannerError(err.message || 'Unable to load account details.');
    }
  }, [token]);

  const loadReportsAndValidation = useCallback(async () => {
    if (isDoctor && !selectedPatientId) {
      setReports(null);
      setReportsLoading(false);
      return;
    }

    setReportsLoading(true);
    setBannerError(null);
    try {
      const rep = await fetchReports(
        token,
        selectedDate,
        effectiveTargetPatientId || undefined
      );
      setReports(rep);

      if (!isDoctor) {
        const listRes = await fetchReadings(token, { page: 1, limit: 100 });
        setAllOwnReadingsForValidation(listRes.readings);
      }
    } catch (err: any) {
      setBannerError(err.message || 'Failed to load glucose reports.');
    } finally {
      setReportsLoading(false);
    }
  }, [token, selectedDate, isDoctor, selectedPatientId, effectiveTargetPatientId]);

  const loadHistoryPage = useCallback(
    async (page: number) => {
      if (isDoctor && !selectedPatientId) {
        setHistoryReadings([]);
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      try {
        const res = await fetchReadings(token, {
          page,
          limit: 20,
          patientId: effectiveTargetPatientId || undefined,
        });
        setHistoryReadings(res.readings);
        setHistoryPagination(res.pagination);
      } catch (err: any) {
        setBannerError(err.message || 'Failed to load reading history.');
      } finally {
        setHistoryLoading(false);
      }
    },
    [token, isDoctor, selectedPatientId, effectiveTargetPatientId]
  );

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadReportsAndValidation();
  }, [loadReportsAndValidation]);

  useEffect(() => {
    loadHistoryPage(1);
  }, [loadHistoryPage]);

  const openAddForm = (slot?: ReadingSlot) => {
    setEditingReading(null);
    setPrefillSlot(slot);
    setFormOpen(true);
  };

  const openEditForm = (reading: GlucoseReading) => {
    setEditingReading(reading);
    setPrefillSlot(undefined);
    setFormOpen(true);
  };

  const handleSaveReading = async (payload: {
    date: string;
    slot: ReadingSlot;
    value: number;
  }) => {
    if (editingReading) {
      await updateReading(token, editingReading.id, payload);
    } else {
      await createReading(token, payload);
    }
    setFormOpen(false);
    setEditingReading(null);
    // If user logged a reading for a different date, focus reports on that date
    if (payload.date !== selectedDate) {
      setSelectedDate(payload.date);
    }
    await Promise.all([
      loadReportsAndValidation(),
      loadHistoryPage(historyPagination.page),
    ]);
  };

  const handleDeleteReading = async (id: string) => {
    await deleteReading(token, id);
    await Promise.all([
      loadReportsAndValidation(),
      loadHistoryPage(historyPagination.page),
    ]);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorErrorMsg(null);
    setDoctorStatusMsg(null);
    setSavingDoctor(true);
    try {
      const res = await updateAssignedDoctor(token, {
        doctorEmail: doctorEmailInput.trim() || null,
      });
      onUserUpdated({ ...res.user, token });
      setDoctorStatusMsg(
        res.user.assignedDoctorName
          ? `Shared reports with ${res.user.assignedDoctorName}.`
          : 'Removed assigned doctor.'
      );
    } catch (err: any) {
      setDoctorErrorMsg(err.message || 'Unable to update assigned doctor.');
    } finally {
      setSavingDoctor(false);
    }
  };

  const activePatient = isDoctor
    ? patients.find((p) => p.id === selectedPatientId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="text-teal-700"
            >
              <path
                d="M12 2.75C12 2.75 5.5 9.9 5.5 14.25C5.5 17.84 8.41 20.75 12 20.75C15.59 20.75 18.5 17.84 18.5 14.25C18.5 9.9 12 2.75 12 2.75Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 14.5H10.5L11.75 12L13.25 16.5L14.5 14.5H16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Sweety
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-teal-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-teal-700 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              History
            </button>
            {!isDoctor && (
              <button
                type="button"
                onClick={() => setActiveTab('care')}
                className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  activeTab === 'care'
                    ? 'border-teal-700 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Care team
              </button>
            )}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {!isDoctor ? (
              <button
                type="button"
                onClick={() => openAddForm()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Log reading
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Account context & date selector bar */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {isDoctor ? 'Doctor clinical view' : 'Patient logbook'} ·{' '}
              {currentUser.name}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              {isDoctor
                ? activePatient
                  ? `${activePatient.name}'s glucose report`
                  : 'Assigned patients'
                : 'Your blood glucose overview'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDoctor && patients.length > 0 && (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="patient-select"
                  className="text-xs font-medium text-slate-500 whitespace-nowrap"
                >
                  Patient
                </label>
                <select
                  id="patient-select"
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <label
                htmlFor="report-date-picker"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap"
              >
                <Calendar className="w-3.5 h-3.5" />
                Report date
              </label>
              <input
                id="report-date-picker"
                type="date"
                max={today}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(today)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  Today
                </button>
              )}
            </div>

            {!isDoctor && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            )}
          </div>
        </section>

        {bannerError && (
          <div
            role="alert"
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
          >
            {bannerError}
          </div>
        )}

        {isDoctor && patients.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <h2 className="text-base font-semibold text-slate-900">
              No patients assigned yet
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Patients can link your email ({currentUser.email}) under their Care
              team tab to share their daily and monthly glucose reports with you.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <ReportCards
                  reports={reports}
                  loading={reportsLoading}
                  readOnly={isDoctor}
                  onAddReading={() => openAddForm()}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5">
                    <DailyBreakdown
                      selectedDate={selectedDate}
                      rangeLabel={
                        reports?.daily.rangeLabel ||
                        formatHumanDate(selectedDate)
                      }
                      readings={reports?.daily.readings || []}
                      readOnly={isDoctor}
                      onAddForSlot={(slot) => openAddForm(slot)}
                      onEdit={openEditForm}
                      onDelete={handleDeleteReading}
                    />
                  </div>
                  <div className="lg:col-span-7">
                    <GlucoseChart
                      selectedDate={selectedDate}
                      readings={reports?.chartReadings || []}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <ReadingsHistory
                readings={historyReadings}
                pagination={historyPagination}
                loading={historyLoading}
                readOnly={isDoctor}
                onPageChange={(page) => loadHistoryPage(page)}
                onEdit={openEditForm}
                onDelete={handleDeleteReading}
                onAddReading={() => openAddForm()}
              />
            )}

            {activeTab === 'care' && !isDoctor && (
              <section className="max-w-xl bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Assigned doctor
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Share read-only access to your glucose reports with your
                    physician.
                  </p>
                </div>

                {currentUser.assignedDoctorName ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {currentUser.assignedDoctorName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {currentUser.assignedDoctorEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingDoctor}
                      onClick={async () => {
                        setSavingDoctor(true);
                        setDoctorErrorMsg(null);
                        setDoctorStatusMsg(null);
                        try {
                          const res = await updateAssignedDoctor(token, {
                            doctorId: null,
                          });
                          onUserUpdated({ ...res.user, token });
                          setDoctorEmailInput('');
                          setDoctorStatusMsg('Removed assigned doctor.');
                        } catch (err: any) {
                          setDoctorErrorMsg(err.message);
                        } finally {
                          setSavingDoctor(false);
                        }
                      }}
                      className="text-xs font-medium text-red-700 hover:text-red-800 whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No doctor is currently assigned to your account.
                  </p>
                )}

                <form onSubmit={handleSaveDoctor} className="space-y-3">
                  <label
                    htmlFor="care-doctor-email"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Doctor email address
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="care-doctor-email"
                      type="email"
                      list="available-doctors"
                      value={doctorEmailInput}
                      onChange={(e) => setDoctorEmailInput(e.target.value)}
                      placeholder="dr.chen@sweety.health"
                      className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    />
                    <datalist id="available-doctors">
                      {doctors.map((d) => (
                        <option key={d.id} value={d.email}>
                          {d.name}
                        </option>
                      ))}
                    </datalist>
                    <button
                      type="submit"
                      disabled={savingDoctor}
                      className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
                    >
                      {savingDoctor ? 'Saving...' : 'Save doctor'}
                    </button>
                  </div>
                  {doctorErrorMsg && (
                    <p className="text-xs text-red-700">{doctorErrorMsg}</p>
                  )}
                  {doctorStatusMsg && (
                    <p className="text-xs text-emerald-700">{doctorStatusMsg}</p>
                  )}
                </form>
              </section>
            )}
          </>
        )}
      </main>

      {/* Add / Edit Reading Modal */}
      {formOpen && !isDoctor && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <ReadingForm
              initialDate={selectedDate}
              initialSlot={prefillSlot}
              editingReading={editingReading}
              existingReadings={allOwnReadingsForValidation}
              today={today}
              onSubmit={handleSaveReading}
              onCancel={() => {
                setFormOpen(false);
                setEditingReading(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
