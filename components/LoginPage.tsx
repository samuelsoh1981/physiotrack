import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  initialMode: 'login' | 'register';
  onNavigate: (mode: 'login' | 'register') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, initialMode, onNavigate }) => {
  // Sync state with props when props change (hash change)
  const isRegistering = initialMode === 'register';
  
  // Form Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('therapist');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    const user = dbService.login(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 4) {
        setError("Password must be at least 4 characters.");
        return;
    }

    const result = dbService.registerUser(name, username, password, role);
    
    if (result.success) {
        setSuccessMsg("Account created! Please sign in.");
        onNavigate('login');
        setPassword('');
        // Keep username filled for convenience
    } else {
        setError(result.message);
    }
  };

  const toggleMode = () => {
    onNavigate(isRegistering ? 'login' : 'register');
    setError('');
    setSuccessMsg('');
    setPassword('');
    if (isRegistering) setName('');
  };

  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#/register`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PhysioTrack AI</h1>
          <p className="text-slate-500 mt-2">
            {isRegistering ? 'Create a new account' : 'Sign in to access the clinic portal'}
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-200">
             ✅ {successMsg}
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">
          
          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Sarah Jones"
                    required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setRole('therapist')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'therapist' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Therapist
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole('admin')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Admin
                        </button>
                    </div>
                </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2 border border-red-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-[0.99]"
          >
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-4">
          <button 
            onClick={toggleMode}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline block w-full"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register here'}
          </button>

          <button 
             onClick={copyLink}
             className="text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 mx-auto transition-colors"
             title="Send this link to therapists to sign up"
          >
             {copiedLink ? (
                <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Link Copied!
                </>
             ) : (
                <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    Share Registration Link
                </>
             )}
          </button>
        </div>
      </div>
    </div>
  );
};