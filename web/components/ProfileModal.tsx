import { useState, useEffect } from 'react';
import { fetchNui } from '../hooks/useNui';
import type { Citizen } from '../types';

interface ProfileModalProps {
  citizen: Citizen;
  onClose: () => void;
  onIssueWarrant?: (citizenid: string, name: string) => void;
}

export function ProfileModal({ citizen, onClose, onIssueWarrant }: ProfileModalProps) {
  const [editingPicture, setEditingPicture] = useState(false);
  const [pictureUrl, setPictureUrl] = useState('');
  const [savingPicture, setSavingPicture] = useState(false);
  const records = citizen.records || [];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSavePicture = async () => {
    if (savingPicture) return;
    setSavingPicture(true);
    
    const result = await fetchNui<{ success: boolean }>('setProfilePicture', {
      citizenid: citizen.citizenid,
      url: pictureUrl || null,
    }, { success: true });
    
    if (result.success) {
      citizen.profilePicture = pictureUrl || null;
      setEditingPicture(false);
      setPictureUrl('');
    }
    setSavingPicture(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div 
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Citizen Profile
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <div className="relative w-40 h-40 bg-zinc-800 border-2 border-zinc-700 rounded-lg overflow-hidden">
                {citizen.profilePicture ? (
                  <img
                    src={citizen.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-20 h-20 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              
              {!editingPicture ? (
                <button
                  onClick={() => {
                    setEditingPicture(true);
                    setPictureUrl(citizen.profilePicture || '');
                  }}
                  className="mt-3 w-full text-sm text-zinc-400 hover:text-amber-400 transition-colors"
                >
                  {citizen.profilePicture ? 'Change Photo' : 'Add Photo'}
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <input
                    type="url"
                    placeholder="Image URL..."
                    value={pictureUrl}
                    onChange={(e) => setPictureUrl(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePicture}
                      disabled={savingPicture}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 rounded px-3 py-1.5 text-sm text-white transition-colors"
                    >
                      {savingPicture ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPicture(false);
                        setPictureUrl('');
                      }}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded px-3 py-1.5 text-sm text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h4 className="text-2xl font-bold text-white">
                    {citizen.charinfo?.firstname} {citizen.charinfo?.lastname}
                  </h4>
                  <p className="text-amber-400 text-sm mt-1">{citizen.citizenid}</p>
                </div>
                <div className="flex items-center gap-3">
                  {citizen.isWanted && (
                    <span className="flex items-center gap-1.5 bg-red-600/20 text-red-400 border border-red-600/30 px-3 py-1.5 rounded-lg text-sm font-medium">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      WANTED
                    </span>
                  )}
                  {onIssueWarrant && !citizen.isWanted && (
                    <button
                      onClick={() => onIssueWarrant(citizen.citizenid, `${citizen.charinfo?.firstname} ${citizen.charinfo?.lastname}`)}
                      className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      Issue Warrant
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Gender</p>
                  <p className="text-white text-lg">{citizen.charinfo?.gender === 0 ? 'Male' : 'Female'}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Birthdate</p>
                  <p className="text-white text-lg">{citizen.charinfo?.birthdate || 'Unknown'}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Job</p>
                  <p className="text-white text-lg">{citizen.job?.label || 'Unemployed'}</p>
                </div>
              </div>

              {records && records.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-zinc-400 text-sm font-bold mb-3 uppercase tracking-wider">Criminal Records ({records.length})</h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {records.map((record) => (
                      <div key={record.id} className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{record.crime}</span>
                          <span className="text-zinc-500 text-xs">{record.date}</span>
                        </div>
                        {record.description && (
                          <p className="text-zinc-400 text-sm mt-1">{record.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs">
                          {record.fine > 0 && <span className="text-amber-400">Fine: ${record.fine}</span>}
                          {record.jailtime > 0 && <span className="text-red-400">Time: {record.jailtime}mo</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
