import React, { useState, useEffect } from 'react';
import { SessionForm } from './components/SessionForm';
import { PayrollDashboard } from './components/PayrollDashboard';
import { LoginPage } from './components/LoginPage';
import { Session, User } from './types';
import { dbService } from './services/dbService';

type Route = 'login' | 'register' | 'log' | 'payroll';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route>('login');
  const [sessions, setSessions] = useState<Session[]>([]);

  // --- Routing Logic ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '');
      
      if (hash === 'register') {
        setCurrentRoute('register');
      } else if (hash === 'login' || hash === '') {
        setCurrentRoute('login');
      } else if (hash === 'log') {
        setCurrentRoute('log');
      } else if (hash === 'dashboard' || hash === 'payroll') {
        setCurrentRoute('payroll');
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when route changes internally
  const navigate = (route: Route) => {
    setCurrentRoute(route);
    // Use a slight delay to ensure state updates before hash if needed, 
    // but here we just push to history
    window.location.hash = `/${route === 'payroll' ? 'dashboard' : route}`;
  };

  // --- Data Logic ---
  const refreshData = () => {
    if (!currentUser) return;
    const data = dbService.getSessions(currentUser.id, currentUser.role);
    setSessions(data);
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
      // Redirect logic after login
      if (currentRoute === 'login' || currentRoute === 'register') {
        navigate(currentUser.role === 'admin' ? 'payroll' : 'log');
      }
    } else {
        // If not logged in, enforce public routes
        if (currentRoute !== 'register') {
             // Don't overwrite if user specifically asked for register
             navigate('login');
        }
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setSessions([]);
    navigate('login');
  };

  const handleSessionSuccess = () => {
    alert("Session logged successfully!");
    refreshData();
  };

  // --- Render Views ---
  
  // Public Views
  if (!currentUser) {
    return (
        <LoginPage 
            onLogin={setCurrentUser} 
            initialMode={currentRoute === 'register' ? 'register' : 'login'}
            onNavigate={(mode) => navigate(mode)}
        />
    );
  }

  // Protected Views
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    P
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">PhysioTrack AI</h1>
                <div className="ml-2 px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500 font-medium">
                  {currentUser.role === 'admin' ? 'Administrator' : 'Therapist Portal'}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">{currentUser.name}</p>
                  <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700">Sign Out</button>
               </div>
               
               {/* Desktop Nav */}
               <div className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {currentUser.role === 'therapist' && (
                    <button
                        onClick={() => navigate('log')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                            currentRoute === 'log' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Log Session
                    </button>
                  )}
                  <button
                      onClick={() => navigate('payroll')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                          currentRoute === 'payroll' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                      {currentUser.role === 'admin' ? 'Reports & Data' : 'My Payroll'}
                  </button>
               </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {currentRoute === 'log' && currentUser.role === 'therapist' ? (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">New Timesheet Entry</h2>
                    <p className="text-slate-500">Record a treatment session and get it signed.</p>
                </div>
                <SessionForm currentUser={currentUser} onSuccess={handleSessionSuccess} />
                
                {/* Recent quick view */}
                <div className="mt-10">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Your Recent Sessions</h3>
                    <div className="space-y-3">
                        {sessions.slice(0, 3).map(s => (
                            <div key={s.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center opacity-75 grayscale hover:grayscale-0 transition-all">
                                <div>
                                    <p className="font-medium text-slate-800">{s.patientName}</p>
                                    <p className="text-xs text-slate-500">{new Date(s.timestamp).toLocaleDateString()} • {s.treatmentType}</p>
                                </div>
                                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{s.durationMinutes} min</span>
                            </div>
                        ))}
                        {sessions.length === 0 && <p className="text-sm text-slate-400 italic">No recent sessions.</p>}
                    </div>
                </div>
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {currentUser.role === 'admin' ? 'System Dashboard' : 'Monthly Overview'}
                    </h2>
                    <p className="text-slate-500">
                        {currentUser.role === 'admin' 
                            ? 'Manage freelancer hours and generate unified payroll reports.' 
                            : 'Track your working hours and generate your invoices.'}
                    </p>
                </div>
                <PayrollDashboard currentUser={currentUser} sessions={sessions} />
            </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 pb-safe">
        {currentUser.role === 'therapist' && (
            <button 
                onClick={() => navigate('log')}
                className={`flex flex-col items-center gap-1 ${currentRoute === 'log' ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="text-xs font-medium">Log</span>
            </button>
        )}
        <button 
            onClick={() => navigate('payroll')}
            className={`flex flex-col items-center gap-1 ${currentRoute === 'payroll' ? 'text-blue-600' : 'text-slate-400'}`}
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <span className="text-xs font-medium">Reports</span>
        </button>
        <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 text-red-400"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-xs font-medium">Exit</span>
        </button>
      </nav>
    </div>
  );
}

export default App;