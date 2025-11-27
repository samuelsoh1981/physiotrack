import React, { useMemo, useState } from 'react';
import { Session, TreatmentType, User } from '../types';
import { generatePayrollAnalysis } from '../services/geminiService';
import { dbService } from '../services/dbService';

interface PayrollDashboardProps {
  currentUser: User;
  sessions: Session[];
}

export const PayrollDashboard: React.FC<PayrollDashboardProps> = ({ currentUser, sessions }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('all');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const therapists = useMemo(() => isAdmin ? dbService.getAllTherapists() : [], [isAdmin]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const date = new Date(session.timestamp);
      const isMonthMatch = date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      const isTherapistMatch = selectedTherapistId === 'all' || session.therapistId === selectedTherapistId;
      
      return isMonthMatch && isTherapistMatch;
    });
  }, [sessions, selectedMonth, selectedYear, selectedTherapistId]);

  // Calculate totals
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let physioCount = 0;
    let massageCount = 0;

    filteredSessions.forEach(s => {
      totalMinutes += s.durationMinutes;
      if (s.treatmentType === TreatmentType.PHYSIOTHERAPY) physioCount++;
      else massageCount++;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes, physioCount, massageCount, totalMinutes };
  }, [filteredSessions]);

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    setAiReport(null);
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });
    const report = await generatePayrollAnalysis(filteredSessions, monthName);
    setAiReport(report);
    setLoadingAi(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredSessions.length === 0) {
      alert("No data to export for this selection.");
      return;
    }

    const headers = [
      "Date",
      "Time", 
      "Patient Name", 
      "Treatment Type", 
      "Duration (mins)", 
      "Therapist", 
      "Signature Verified", 
      "Session ID"
    ];

    const rows = filteredSessions.map(s => {
      const d = new Date(s.timestamp);
      const esc = (t: any) => `"${String(t).replace(/"/g, '""')}"`;
      
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        esc(s.patientName),
        esc(s.treatmentType),
        s.durationMinutes,
        esc(s.therapistName),
        s.signatureDataUrl ? "Yes" : "No",
        esc(s.id)
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const therapistLabel = selectedTherapistId === 'all' ? 'All_Therapists' : selectedTherapistId;
    link.setAttribute("download", `PhysioTrack_${therapistLabel}_${selectedMonth + 1}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-xl font-bold text-slate-800">
            {isAdmin ? 'Clinic Overview' : 'My Payroll'}
          </h2>
          
          <div className="flex items-center gap-2">
            <select
                value={selectedMonth}
                onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    setAiReport(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            >
                {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
                ))}
            </select>
            <select
                value={selectedYear}
                onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setAiReport(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
            </select>
          </div>

          {isAdmin && (
             <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase">Filter:</span>
                <select
                    value={selectedTherapistId}
                    onChange={(e) => {
                        setSelectedTherapistId(e.target.value);
                        setAiReport(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-slate-700"
                >
                    <option value="all">All Therapists</option>
                    {therapists.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
             </div>
          )}
        </div>

        <div className="flex gap-2">
            <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Export CSV
            </button>
            <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-xl text-white shadow-lg">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Time</p>
          <p className="text-3xl font-bold">{stats.hours}h {stats.minutes}m</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Sessions</p>
          <p className="text-3xl font-bold text-slate-800">{filteredSessions.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-1">Physiotherapy</p>
          <p className="text-3xl font-bold text-teal-600">{stats.physioCount}</p>
          <p className="text-xs text-slate-400">45 mins / session</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-1">Sports Massage</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.massageCount}</p>
          <p className="text-xs text-slate-400">Variable duration</p>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700">Session History</h3>
          <span className="text-xs text-slate-500 font-mono">
            {filteredSessions.length} record(s) found
          </span>
        </div>
        
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            No sessions recorded for these criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Date & Time</th>
                  {isAdmin && <th className="px-6 py-3">Therapist</th>}
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {new Date(session.timestamp).toLocaleDateString()}
                      <span className="block text-xs text-slate-400">
                        {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    {isAdmin && (
                        <td className="px-6 py-4 font-medium text-slate-700">
                            {session.therapistName}
                        </td>
                    )}
                    <td className="px-6 py-4 font-medium text-slate-800">{session.patientName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.treatmentType === TreatmentType.PHYSIOTHERAPY 
                          ? 'bg-teal-100 text-teal-800' 
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {session.treatmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4">{session.durationMinutes} mins</td>
                    <td className="px-6 py-4 text-right">
                      {session.signatureDataUrl && (
                        <img 
                          src={session.signatureDataUrl} 
                          alt="Sig" 
                          className="h-8 inline-block opacity-80 border border-slate-200 rounded bg-white" 
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Analysis Section */}
      <div className="bg-slate-900 rounded-xl p-6 text-slate-200 shadow-xl overflow-hidden relative">
         <div className="absolute top-0 right-0 p-3 opacity-10">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
         </div>
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    ✨ Smart Payroll Assistant
                </h3>
                <button
                    onClick={handleGenerateReport}
                    disabled={loadingAi || filteredSessions.length === 0}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2"
                >
                    {loadingAi ? 'Analyzing...' : 'Generate Analysis'}
                </button>
            </div>
            
            {aiReport ? (
                <div className="bg-slate-800/50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap font-mono border border-slate-700">
                    {aiReport}
                </div>
            ) : (
                <p className="text-slate-400 text-sm">
                    {filteredSessions.length > 0 
                        ? `Click to generate an AI summary for ${selectedTherapistId === 'all' ? 'all therapists' : 'selected therapist'} in this period.`
                        : "No data available for AI analysis."}
                </p>
            )}
         </div>
      </div>
    </div>
  );
};