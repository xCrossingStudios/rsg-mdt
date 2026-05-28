import { useState, useEffect, useMemo } from 'react';
import { fetchNui } from '../hooks/useNui';
import type { ChargeTemplate } from '../types';

interface IssueChargesModalProps {
  citizenid: string;
  citizenName: string;
  onClose: () => void;
  onIssued?: () => void;
}

const categoryColors: Record<string, string> = {
  felony: 'bg-red-950/50 text-red-400 border-red-800',
  misdemeanor: 'bg-amber-950/50 text-amber-400 border-amber-800',
  infraction: 'bg-blue-950/50 text-blue-400 border-blue-800',
};

export function IssueChargesModal({ citizenid, citizenName, onClose, onIssued }: IssueChargesModalProps) {
  const [templates, setTemplates] = useState<ChargeTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      const result = await fetchNui<ChargeTemplate[]>('getChargeTemplates', {}, []);
      setTemplates(result);
    };
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const query = searchQuery.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      t.category.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  const selectedCharges = useMemo(() => {
    return templates.filter(t => selectedIds.has(t.id));
  }, [templates, selectedIds]);

  const totals = useMemo(() => {
    return selectedCharges.reduce(
      (acc, c) => ({ fine: acc.fine + c.fine, jailtime: acc.jailtime + c.jailtime }),
      { fine: 0, jailtime: 0 }
    );
  }, [selectedCharges]);

  const toggleCharge = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedCharges.length === 0) {
      setError('Select at least one charge');
      return;
    }

    setSubmitting(true);
    setError(null);

    const charges = selectedCharges.map(c => ({
      templateId: c.id,
      name: c.name,
      description: c.description || undefined,
      fine: c.fine,
      jailtime: c.jailtime,
    }));

    const result = await fetchNui<{ success: boolean; message: string }>(
      'issueCharges',
      { citizenid, charges },
      { success: true, message: 'Charges issued' }
    );

    setSubmitting(false);

    if (result.success) {
      onIssued?.();
      onClose();
    } else {
      setError(result.message || 'Failed to issue charges');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h3 className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Issue Charges
            </h3>
            <p className="text-zinc-400 text-sm mt-1">
              To: <span className="text-amber-400">{citizenName}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(85vh-140px)]">
          <div className="w-1/2 border-r border-zinc-800 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <input
                type="text"
                placeholder="Search charges..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredTemplates.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No charges found</p>
              ) : (
                filteredTemplates.map(charge => (
                  <button
                    key={charge.id}
                    onClick={() => toggleCharge(charge.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedIds.has(charge.id)
                        ? 'bg-amber-600/20 border-amber-600'
                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{charge.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded border ${categoryColors[charge.category] || 'bg-zinc-800 text-zinc-400'}`}>
                            {charge.category}
                          </span>
                        </div>
                        {charge.description && (
                          <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{charge.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {charge.fine > 0 && (
                          <p className="text-amber-400 text-sm font-medium">${charge.fine}</p>
                        )}
                        {charge.jailtime > 0 && (
                          <p className="text-red-400 text-xs">{charge.jailtime}mo</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="w-1/2 flex flex-col">
            <div className="p-4 border-b border-zinc-800">
              <h4 className="text-zinc-300 font-bold">Selected Charges ({selectedCharges.length})</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {selectedCharges.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No charges selected</p>
              ) : (
                selectedCharges.map(charge => (
                  <div
                    key={charge.id}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{charge.name}</span>
                      <button
                        onClick={() => toggleCharge(charge.id)}
                        className="text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      {charge.fine > 0 && <span className="text-amber-400">Fine: ${charge.fine}</span>}
                      {charge.jailtime > 0 && <span className="text-red-400">Jail: {charge.jailtime}mo</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-zinc-400 text-sm">Total Fine</p>
                  <p className="text-amber-400 text-2xl font-bold">${totals.fine}</p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-400 text-sm">Total Jail Time</p>
                  <p className="text-red-400 text-2xl font-bold">{totals.jailtime} mo</p>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 rounded-lg px-4 py-2.5 text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedCharges.length === 0}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-400 rounded-lg px-4 py-2.5 text-white font-medium transition-colors"
                >
                  {submitting ? 'Processing...' : `Issue ${selectedCharges.length} Charge${selectedCharges.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
