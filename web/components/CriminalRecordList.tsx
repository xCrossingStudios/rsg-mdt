import type { IssuedCharge } from '../types';

interface CriminalRecordListProps {
  charges: IssuedCharge[];
  loading: boolean;
  onChargeClick: (charge: IssuedCharge) => void;
  onRefresh?: () => void;
}

export function CriminalRecordList({ charges, loading, onChargeClick, onRefresh }: CriminalRecordListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'felony': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'misdemeanor': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'infraction': return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-800/30 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-zinc-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!charges || charges.length === 0) {
    return (
      <div className="bg-zinc-800/30 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-zinc-500 text-sm">No criminal records found</p>
        <p className="text-zinc-600 text-xs mt-1">This citizen has a clean record</p>
      </div>
    );
  }

  const totalFines = charges.reduce((sum, c) => sum + (c.fine || 0), 0);
  const totalJailtime = charges.reduce((sum, c) => sum + (c.jailtime || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-400">{charges.length} charge(s)</span>
          {totalFines > 0 && (
            <span className="text-amber-400 font-medium">${totalFines.toLocaleString()} total fines</span>
          )}
          {totalJailtime > 0 && (
            <span className="text-red-400 font-medium">{totalJailtime} months total</span>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {charges.map((charge) => (
          <button
            key={charge.id}
            onClick={() => onChargeClick(charge)}
            className="w-full bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-lg p-3 text-left transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium truncate">{charge.charge_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor('felony')}`}>
                    Charge
                  </span>
                </div>
                {charge.charge_description && (
                  <p className="text-zinc-500 text-sm truncate">{charge.charge_description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>{formatDate(charge.created_at)}</span>
                <svg className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-zinc-700/50">
              <div className="flex items-center gap-1 text-xs">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-zinc-400">Officer:</span>
                <span className="text-zinc-300">{charge.officer}</span>
              </div>
              {charge.fine > 0 && (
                <span className="text-amber-400 text-xs font-medium">${charge.fine} fine</span>
              )}
              {charge.jailtime > 0 && (
                <span className="text-red-400 text-xs font-medium">{charge.jailtime} mo</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
