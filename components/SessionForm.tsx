import React, { useState } from 'react';
import { TreatmentType, Session, User } from '../types';
import { SignaturePad } from './SignaturePad';
import { dbService } from '../services/dbService';

interface SessionFormProps {
  currentUser: User;
  onSuccess: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({ currentUser, onSuccess }) => {
  const [patientName, setPatientName] = useState('');
  const [treatmentType, setTreatmentType] = useState<TreatmentType>(TreatmentType.SPORTS_MASSAGE);
  const [duration, setDuration] = useState<number>(60);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logic: Physio is strictly 45 mins. Massage is 40/45/60.
  const handleTypeChange = (type: TreatmentType) => {
    setTreatmentType(type);
    if (type === TreatmentType.PHYSIOTHERAPY) {
      setDuration(45);
    } else {
      setDuration(60); // Default for massage
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      alert("Patient signature is required to verify the session.");
      return;
    }
    if (!patientName.trim()) {
        alert("Patient name is required.");
        return;
    }

    setIsSubmitting(true);

    const newSession: Session = {
      id: Math.random().toString(36).substring(2, 15),
      therapistId: currentUser.id,
      therapistName: currentUser.name,
      patientName,
      treatmentType,
      durationMinutes: duration,
      timestamp: new Date().toISOString(),
      signatureDataUrl: signature,
    };

    // Save to centralized DB
    setTimeout(() => {
        dbService.addSession(newSession);
        
        // Reset form
        setPatientName('');
        setSignature(null);
        setTreatmentType(TreatmentType.SPORTS_MASSAGE);
        setDuration(60);
        setIsSubmitting(false);
        onSuccess();
    }, 600);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-slate-800">Log Treatment Session</h2>
        <div className="text-right">
            <span className="text-xs text-slate-400 block">Therapist</span>
            <span className="text-sm font-medium text-blue-600">{currentUser.name}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Patient Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
          <input
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. John Doe"
          />
        </div>

        {/* Treatment Type & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Treatment Type</label>
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => handleTypeChange(TreatmentType.SPORTS_MASSAGE)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  treatmentType === TreatmentType.SPORTS_MASSAGE
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sports Massage
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange(TreatmentType.PHYSIOTHERAPY)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  treatmentType === TreatmentType.PHYSIOTHERAPY
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Physiotherapy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={treatmentType === TreatmentType.PHYSIOTHERAPY}
              className={`w-full px-4 py-2 rounded-lg border border-slate-300 outline-none transition-all ${
                  treatmentType === TreatmentType.PHYSIOTHERAPY ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {treatmentType === TreatmentType.PHYSIOTHERAPY ? (
                <option value={45}>45 Minutes (Strict)</option>
              ) : (
                <>
                  <option value={40}>40 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Signature */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Patient Verification Signature
            <span className="text-xs font-normal text-slate-500 ml-2">(Required)</span>
          </label>
          <SignaturePad onEnd={setSignature} onClear={() => setSignature(null)} />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all ${
            isSubmitting
              ? 'bg-slate-400 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-[0.99]'
          }`}
        >
          {isSubmitting ? 'Verifying & Saving...' : 'Sign Off & Save Session'}
        </button>
      </form>
    </div>
  );
};