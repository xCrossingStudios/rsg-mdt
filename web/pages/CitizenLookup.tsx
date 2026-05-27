import { useState } from 'react';
import { fetchNui } from '../hooks/useNui';
import type { Citizen } from '../types';

interface CitizenLookupProps {
  onIssueWarrant?: (citizenid: string, name: string) => void;
}

export function CitizenLookup({ onIssueWarrant }: CitizenLookupProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Citizen[]>([]);
  const [selected, setSelected] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingPicture, setEditingPicture] = useState(false);
  const [pictureUrl, setPictureUrl] = useState('');
  const [savingPicture, setSavingPicture] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const data = await fetchNui<Citizen[]>('searchCitizens', { query }, [
      { citizenid: 'CIT001', charinfo: { firstname: 'John', lastname: 'Marston', gender: 0, birthdate: '1873-05-21' }, job: { name: 'outlaw', label: 'Outlaw', grade: { name: 'Member' } } },
      { citizenid: 'CIT002', charinfo: { firstname: 'Arthur', lastname: 'Morgan', gender: 0, birthdate: '1863-06-14' }, job: { name: 'cowboy', label: 'Cowboy', grade: { name: 'Member' } } },
    ]);
    setResults(data);
    setLoading(false);
  };

  const handleSelect = async (citizen: Citizen) => {
    const data = await fetchNui<Citizen>('getCitizen', { citizenid: citizen.citizenid }, {
      citizenid: citizen.citizenid,
      charinfo: citizen.charinfo,
      job: citizen.job,
      money: { cash: 150, bank: 2500, bloodmoney: 50 },
      metadata: {},
      profilePicture: null,
    });
    setSelected(data);
    setEditingPicture(false);
    setPictureUrl('');
  };

  const handleSavePicture = async () => {
    if (!selected || savingPicture) return;
    setSavingPicture(true);
    
    const result = await fetchNui<{ success: boolean }>('setProfilePicture', {
      citizenid: selected.citizenid,
      url: pictureUrl || null,
    }, { success: true });
    
    if (result.success) {
      setSelected({ ...selected, profilePicture: pictureUrl || null });
      setEditingPicture(false);
      setPictureUrl('');
    }
    setSavingPicture(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Citizen Lookup
      </h2>

      {/* Search Bar */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name or citizen ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-600"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 px-6 py-3 rounded-lg text-white font-medium transition-colors"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && !selected && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-zinc-400 text-sm">Name</th>
                <th className="px-4 py-3 text-left text-zinc-400 text-sm">Citizen ID</th>
                <th className="px-4 py-3 text-left text-zinc-400 text-sm">Job</th>
                <th className="px-4 py-3 text-left text-zinc-400 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((citizen) => (
                <tr key={citizen.citizenid} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-white">
                    {citizen.charinfo?.firstname} {citizen.charinfo?.lastname}
                  </td>
                  <td className="px-4 py-3 text-amber-400 text-sm">{citizen.citizenid}</td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{citizen.job?.label || 'Unemployed'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSelect(citizen)}
                      className="text-amber-400 hover:text-amber-300 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Citizen Details */}
      {selected && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="flex gap-6">
            {/* Profile Picture Section */}
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 bg-zinc-800 border-2 border-zinc-700 rounded-lg overflow-hidden">
                {selected.profilePicture ? (
                  <img
                    src={selected.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              
              {!editingPicture ? (
                <button
                  onClick={() => {
                    setEditingPicture(true);
                    setPictureUrl(selected.profilePicture || '');
                  }}
                  className="mt-2 w-full text-xs text-zinc-400 hover:text-amber-400 transition-colors"
                >
                  {selected.profilePicture ? 'Change Photo' : 'Add Photo'}
                </button>
              ) : (
                <div className="mt-2 space-y-2">
                  <input
                    type="url"
                    placeholder="Image URL..."
                    value={pictureUrl}
                    onChange={(e) => setPictureUrl(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-600"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={handleSavePicture}
                      disabled={savingPicture}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 rounded px-2 py-1 text-xs text-white transition-colors"
                    >
                      {savingPicture ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingPicture(false);
                        setPictureUrl('');
                      }}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded px-2 py-1 text-xs text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Citizen Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-white text-lg font-bold">
                  {selected.charinfo?.firstname} {selected.charinfo?.lastname}
                </h3>
                <div className="flex items-center gap-4">
                  {onIssueWarrant && (
                    <button
                      onClick={() => onIssueWarrant(
                        selected.citizenid,
                        `${selected.charinfo?.firstname} ${selected.charinfo?.lastname}`
                      )}
                      className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-white text-sm transition-colors"
                    >
                      Issue Warrant
                    </button>
                  )}
                  <button
                    onClick={() => setSelected(null)}
                    className="text-zinc-500 hover:text-zinc-300 text-sm"
                  >
                    ← Back to Results
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide">Citizen ID</p>
                  <p className="text-zinc-200 mt-1">{selected.citizenid}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide">Gender</p>
                  <p className="text-zinc-200 mt-1">{selected.charinfo?.gender === 0 ? 'Male' : 'Female'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide">Birthdate</p>
                  <p className="text-zinc-200 mt-1">{selected.charinfo?.birthdate || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide">Job</p>
                  <p className="text-zinc-200 mt-1">{selected.job?.label || 'Unemployed'}</p>
                </div>
              </div>

              {selected.money && (
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <h4 className="text-zinc-400 text-sm font-bold mb-3">Financial Information</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-800/50 rounded p-3">
                      <p className="text-zinc-500 text-xs uppercase">Cash</p>
                      <p className="text-zinc-200 text-lg">${selected.money.cash || 0}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded p-3">
                      <p className="text-zinc-500 text-xs uppercase">Bank</p>
                      <p className="text-zinc-200 text-lg">${selected.money.bank || 0}</p>
                    </div>
                    <div className="bg-zinc-800/50 rounded p-3">
                      <p className="text-zinc-500 text-xs uppercase">Blood Money</p>
                      <p className="text-zinc-200 text-lg">${selected.money.bloodmoney || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
